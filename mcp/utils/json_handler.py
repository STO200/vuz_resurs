# mcp/utils/json_handler.py

"""
Модуль для работы с JSON файлами
"""

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class JSONHandler:
    """Класс для работы с JSON файлами ресурсов"""

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            self.data_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Создана директория: {self.data_dir}")

    def read_file(self, filepath: str) -> list[dict[str, Any]]:
        """
        Читает JSON файл с ресурсами

        Args:
            filepath: Путь к файлу относительно data_dir

        Returns:
            Список ресурсов

        Raises:
            FileNotFoundError: Если файл не найден
            json.JSONDecodeError: Если JSON некорректен
        """
        full_path = self.data_dir / filepath

        logger.debug(f"Чтение файла: {full_path}")

        if not full_path.exists():
            raise FileNotFoundError(f"Файл не найден: {full_path}")

        with full_path.open(encoding="utf-8") as f:
            data = json.load(f)

        # Убеждаемся, что это список
        if not isinstance(data, list):
            data = [data]

        logger.debug(f"Загружено {len(data)} ресурсов из {filepath}")
        return data

    def write_file(self, filepath: str, data: list[dict[str, Any]], backup: bool = True) -> Path:
        """
        Пишет JSON файл с ресурсами

        Args:
            filepath: Путь к файлу относительно data_dir
            data: Список ресурсов
            backup: Создать резервную копию (default: True)

        Returns:
            Путь к сохраненному файлу
        """
        full_path = self.data_dir / filepath

        # Создаем директории если их нет
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Создаем бэкап если файл существует
        if backup and full_path.exists():
            backup_path = full_path.with_suffix(".json.backup")
            logger.info(f"Создание резервной копии: {backup_path}")
            with full_path.open(encoding="utf-8") as f:
                backup_data = f.read()
            with backup_path.open("w", encoding="utf-8") as f:
                f.write(backup_data)

        # Пишем файл
        logger.debug(f"Запись файла: {full_path}")
        with full_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"✅ Файл сохранен: {full_path} ({len(data)} ресурсов)")
        return full_path

    def validate_structure(self, resource: dict[str, Any]) -> tuple:
        """
        Валидирует структуру ресурса

        Args:
            resource: Словарь ресурса

        Returns:
            (is_valid, errors_list)
        """
        required_fields = ["id", "name", "description", "website", "type"]

        errors = []

        for field in required_fields:
            if field not in resource:
                errors.append(f"Отсутствует поле: {field}")
            elif not isinstance(resource[field], str):
                errors.append(f"Поле {field} должно быть строкой")
            elif not resource[field].strip():
                errors.append(f"Поле {field} пусто")

        return (len(errors) == 0, errors)

    def list_files(self, pattern: str = "*.json") -> list[Path]:
        """
        Списывает все JSON файлы в data_dir

        Args:
            pattern: Паттерн поиска файлов

        Returns:
            Список путей к файлам
        """
        files = list(self.data_dir.rglob(pattern))
        logger.info(f"Найдено {len(files)} JSON файлов")
        return files

    def get_resource_count(self, filepath: str) -> int:
        """
        Возвращает количество ресурсов в файле

        Args:
            filepath: Путь к файлу

        Returns:
            Количество ресурсов
        """
        try:
            data = self.read_file(filepath)
            return len(data)
        except Exception as e:
            logger.error(f"Ошибка подсчета ресурсов: {e}")
            return 0

    def merge_files(self, source_file: str, dest_file: str) -> int:
        """
        Объединяет ресурсы из одного файла в другой

        Args:
            source_file: Исходный файл
            dest_file: Целевой файл

        Returns:
            Количество добавленных ресурсов
        """
        try:
            source_data = self.read_file(source_file)
            dest_data = self.read_file(dest_file)

            # Объединяем по ID
            existing_ids = {r["id"] for r in dest_data}
            added = 0

            for resource in source_data:
                if resource["id"] not in existing_ids:
                    dest_data.append(resource)
                    added += 1

            self.write_file(dest_file, dest_data)
            logger.info(f"Добавлено {added} ресурсов из {source_file} в {dest_file}")
            return added

        except Exception as e:
            logger.error(f"Ошибка объединения файлов: {e}")
            return 0
