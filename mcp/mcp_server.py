#!/usr/bin/env python3

"""
MCP сервис для валидации ресурсов ВУЗов
Работает с Claude Code в WSL

Использование:
    python3 mcp_server.py

Конфигурация (~/.config/claude/config.json):
    {
      "mcpServers": {
        "resource-validator": {
          "command": "python3",
          "args": ["/path/to/mcp_server.py"]
        }
      }
    }
"""

import json
import asyncio
import logging
from pathlib import Path
import sys

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("❌ Ошибка: не установлена библиотека mcp")
    print("Установите: pip install mcp")
    sys.exit(1)

from utils.web_scraper import WebScraper
from utils.validator import ResourceValidator
from utils.json_handler import JSONHandler
from utils.report_generator import ReportGenerator

# ==================== ЛОГИРОВАНИЕ ====================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ==================== ПУТИ ====================

# Получаем директорию проекта (родитель mcp папки)
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
REPORTS_DIR = PROJECT_ROOT / "reports"

logger.info(f"📁 Корень проекта: {PROJECT_ROOT}")
logger.info(f"📁 Папка data: {DATA_DIR}")
logger.info(f"📁 Папка reports: {REPORTS_DIR}")

# ==================== MCP СЕРВЕР ====================

app = FastMCP("resource-validator")

# Инициализируем компоненты с правильными путями
scraper = WebScraper()
validator = ResourceValidator()
json_handler = JSONHandler(str(DATA_DIR))
report_gen = ReportGenerator(str(REPORTS_DIR))

# ==================== ИНСТРУМЕНТЫ ====================


@app.tool()
def read_json_file(filepath: str) -> dict:
    """
    Читает JSON файл с ресурсами

    Args:
        filepath: Путь к JSON файлу (относительно data/)

    Returns:
        Содержимое JSON файла в виде словаря

    Example:
        read_json_file("hse/infoEvents.json")
    """
    try:
        logger.info(f"Чтение файла: {filepath}")
        data = json_handler.read_file(filepath)
        logger.info(f"✅ Успешно загружено {len(data)} ресурсов")
        return {"status": "success", "count": len(data), "data": data}
    except FileNotFoundError:
        logger.error(f"Файл не найден: {filepath}")
        return {"status": "error", "message": f"❌ Файл не найден: {filepath}"}
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        return {"status": "error", "message": f"❌ Ошибка парсинга JSON: {e}"}
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


@app.tool()
def fetch_webpage(url: str, max_chars: int = 3000) -> dict:
    """
    Захватывает содержимое веб-страницы

    Args:
        url: URL страницы для захвата
        max_chars: Максимум символов в ответе (default: 3000)

    Returns:
        Текстовое содержимое страницы

    Example:
        fetch_webpage("https://dod.hse.ru", 5000)
    """
    try:
        logger.info(f"Загрузка страницы: {url}")
        content = asyncio.run(scraper.fetch_url(url, max_chars))
        logger.info(f"✅ Страница загружена ({len(content)} символов)")
        return {
            "status": "success",
            "url": url,
            "content": content,
            "length": len(content),
        }
    except TimeoutError:
        logger.error(f"Таймаут при загрузке: {url}")
        return {"status": "error", "message": f"❌ Таймаут при загрузке {url}"}
    except Exception as e:
        logger.error(f"Ошибка загрузки {url}: {e}")
        return {"status": "error", "message": f"❌ Ошибка загрузки {url}: {e}"}


@app.tool()
def validate_resource(resource_id: str, current_description: str, webpage_content: str) -> dict:
    """
    Валидирует описание ресурса по контенту сайта

    Args:
        resource_id: ID ресурса (для логирования)
        current_description: Текущее описание из JSON
        webpage_content: Содержимое веб-страницы

    Returns:
        Результат валидации с предложением нового описания

    Example:
        validate_resource(
            "general_open_day_hse",
            "Масштабное мероприятие...",
            "Содержимое страницы dod.hse.ru..."
        )
    """
    try:
        logger.info(f"Валидация ресурса: {resource_id}")
        result = validator.validate(resource_id, current_description, webpage_content)
        logger.info(f"✅ Валидация завершена: {result['status']}")
        return result
    except Exception as e:
        logger.error(f"Ошибка валидации {resource_id}: {e}")
        return {"status": "error", "message": f"❌ Ошибка валидации: {e}"}


@app.tool()
def batch_get_resources(filepath: str, start_index: int = 0, count: int = 10) -> dict:
    """
    Получает пакет ресурсов из файла

    Args:
        filepath: Путь к JSON файлу
        start_index: Начальный индекс (default: 0)
        count: Количество ресурсов (default: 10)

    Returns:
        Массив ресурсов с основными полями

    Example:
        batch_get_resources("hse/infoEvents.json", 0, 5)
    """
    try:
        logger.info(f"Получение batch из {filepath} (index: {start_index}, count: {count})")
        data = json_handler.read_file(filepath)

        batch = data[start_index : start_index + count]

        # Оставляем только важные поля
        simplified = []
        for resource in batch:
            simplified.append(
                {
                    "id": resource.get("id"),
                    "name": resource.get("name"),
                    "description": resource.get("description", ""),
                    "website": resource.get("website"),
                    "type": resource.get("type"),
                }
            )

        logger.info(f"✅ Получено {len(simplified)} ресурсов")
        return {
            "status": "success",
            "filepath": filepath,
            "total_resources": len(data),
            "batch_size": len(simplified),
            "start_index": start_index,
            "resources": simplified,
        }
    except Exception as e:
        logger.error(f"Ошибка получения batch: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


@app.tool()
def update_json_file(filepath: str, updated_data: str) -> dict:
    """
    Обновляет JSON файл с исправленными данными

    Args:
        filepath: Путь к JSON файлу
        updated_data: JSON-строка с обновленными ресурсами

    Returns:
        Статус обновления

    Example:
        update_json_file("hse/infoEvents.json", "[{...}, {...}]")
    """
    try:
        logger.info(f"Обновление файла: {filepath}")

        # Парсим JSON
        data = json.loads(updated_data)
        if not isinstance(data, list):
            data = [data]

        # Сохраняем
        json_handler.write_file(filepath, data)

        logger.info(f"✅ Файл обновлен: {len(data)} ресурсов")
        return {
            "status": "success",
            "filepath": filepath,
            "updated_count": len(data),
            "message": f"✅ Файл {filepath} успешно обновлен",
        }
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        return {"status": "error", "message": f"❌ Ошибка парсинга JSON: {e}"}
    except Exception as e:
        logger.error(f"Ошибка обновления файла: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


@app.tool()
def save_validation_report(report_data: str, filename: str | None = None) -> dict:
    """
    Сохраняет отчет о валидации в CSV

    Args:
        report_data: JSON-строка с результатами валидации
        filename: Имя файла отчета (optional, генерируется автоматически)

    Returns:
        Путь к сохраненному файлу

    Example:
        save_validation_report(
            '[{"resource_id": "...", "status": "OK", ...}]',
            "validation_report.csv"
        )
    """
    try:
        logger.info("Сохранение отчета валидации")

        # Парсим данные
        data = json.loads(report_data)
        if not isinstance(data, list):
            data = [data]

        # Генерируем отчет
        filepath = report_gen.generate_csv(data, filename)

        logger.info(f"✅ Отчет сохранен: {filepath}")
        return {
            "status": "success",
            "filepath": str(filepath),
            "record_count": len(data),
            "message": f"✅ Отчет сохранен: {filepath}",
        }
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        return {"status": "error", "message": f"❌ Ошибка парсинга JSON: {e}"}
    except Exception as e:
        logger.error(f"Ошибка сохранения отчета: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


@app.tool()
def list_resources(filepath: str) -> dict:
    """
    Выводит список всех ресурсов в файле

    Args:
        filepath: Путь к JSON файлу

    Returns:
        Список ID и названий ресурсов

    Example:
        list_resources("hse/infoEvents.json")
    """
    try:
        logger.info(f"Получение списка ресурсов из {filepath}")
        data = json_handler.read_file(filepath)

        resources = [{"index": i, "id": r.get("id"), "name": r.get("name")} for i, r in enumerate(data)]

        logger.info(f"✅ Найдено {len(resources)} ресурсов")
        return {
            "status": "success",
            "filepath": filepath,
            "total_count": len(resources),
            "resources": resources,
        }
    except Exception as e:
        logger.error(f"Ошибка получения списка: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


@app.tool()
def get_resource_by_id(filepath: str, resource_id: str) -> dict:
    """
    Получает полную информацию о ресурсе по ID

    Args:
        filepath: Путь к JSON файлу
        resource_id: ID ресурса

    Returns:
        Полная информация о ресурсе

    Example:
        get_resource_by_id("hse/infoEvents.json", "general_open_day_hse")
    """
    try:
        logger.info(f"Получение ресурса {resource_id} из {filepath}")
        data = json_handler.read_file(filepath)

        for resource in data:
            if resource.get("id") == resource_id:
                logger.info(f"✅ Ресурс найден: {resource_id}")
                return {"status": "success", "resource": resource}

        logger.warning(f"Ресурс не найден: {resource_id}")
        return {"status": "error", "message": f"❌ Ресурс {resource_id} не найден"}
    except Exception as e:
        logger.error(f"Ошибка получения ресурса: {e}")
        return {"status": "error", "message": f"❌ Ошибка: {e}"}


# ==================== ЗАПУСК ====================

if __name__ == "__main__":
    logger.info("🚀 MCP сервис resource-validator запущен")
    logger.info("Инструменты доступны в Claude Code:")
    logger.info("  - read_json_file")
    logger.info("  - fetch_webpage")
    logger.info("  - validate_resource")
    logger.info("  - batch_get_resources")
    logger.info("  - update_json_file")
    logger.info("  - save_validation_report")
    logger.info("  - list_resources")
    logger.info("  - get_resource_by_id")

    app.run()
