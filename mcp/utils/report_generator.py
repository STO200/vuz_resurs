#  mcp/utils/report_generator.py

"""
Модуль для генерации отчетов валидации
"""

import csv
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Класс для генерации отчетов о валидации"""

    def __init__(self, reports_dir: str = "reports"):
        self.reports_dir = Path(reports_dir)
        if not self.reports_dir.exists():
            self.reports_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Создана директория отчетов: {self.reports_dir}")

    def generate_csv(self, records: list[dict[str, Any]], filename: str | None = None) -> Path:
        """
        Генерирует CSV отчет о валидации

        Args:
            records: Список записей валидации
            filename: Имя файла (optional, генерируется автоматически)

        Returns:
            Путь к сохраненному отчету
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"validation_report_{timestamp}.csv"

        filepath = self.reports_dir / filename

        logger.info(f"Генерация CSV отчета: {filepath}")

        # Поля для CSV
        fieldnames = [
            "resource_id",
            "validation_status",
            "confidence",
            "was_auto_corrected",
            "name_match",
            "description_match",
            "url_relevance",
            "key_discrepancies",
            "current_description",
            "suggested_description",
            "reasoning",
            "timestamp",
        ]

        try:
            with filepath.open("w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for record in records:
                    semantic = record.get("semantic_analysis", {})
                    key_discrepancies = "; ".join(semantic.get("key_discrepancies", []))

                    row = {
                        "resource_id": record.get("resource_id", ""),
                        "validation_status": record.get("validation_status", ""),
                        "confidence": record.get("confidence", ""),
                        "was_auto_corrected": record.get("was_auto_corrected", False),
                        "name_match": semantic.get("name_match", ""),
                        "description_match": semantic.get("description_match", ""),
                        "url_relevance": semantic.get("url_relevance", ""),
                        "key_discrepancies": key_discrepancies,
                        "current_description": record.get("current_description", "").replace("\n", " ")[:200],
                        "suggested_description": record.get("suggested_description", "").replace("\n", " ")[:200],
                        "reasoning": record.get("reasoning", "").replace("\n", " ")[:200],
                        "timestamp": datetime.now().isoformat(),
                    }
                    writer.writerow(row)

            logger.info(f"✅ CSV отчет создан: {filepath} ({len(records)} записей)")
            return filepath

        except Exception as e:
            logger.error(f"Ошибка при генерации CSV: {e}")
            raise

    def generate_json(self, records: list[dict[str, Any]], filename: str | None = None) -> Path:
        """
        Генерирует JSON отчет о валидации

        Args:
            records: Список записей валидации
            filename: Имя файла (optional, генерируется автоматически)

        Returns:
            Путь к сохраненному отчету
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"validation_report_{timestamp}.json"

        filepath = self.reports_dir / filename

        logger.info(f"Генерация JSON отчета: {filepath}")

        try:
            report_data = {
                "timestamp": datetime.now().isoformat(),
                "total_records": len(records),
                "summary": self._generate_summary(records),
                "records": records,
            }

            with filepath.open("w", encoding="utf-8") as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ JSON отчет создан: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Ошибка при генерации JSON: {e}")
            raise

    def generate_html(self, records: list[dict[str, Any]], filename: str | None = None) -> Path:
        """
        Генерирует HTML отчет о валидации

        Args:
            records: Список записей валидации
            filename: Имя файла (optional, генерируется автоматически)

        Returns:
            Путь к сохраненному отчету
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"validation_report_{timestamp}.html"

        filepath = self.reports_dir / filename

        logger.info(f"Генерация HTML отчета: {filepath}")

        try:
            summary = self._generate_summary(records)

            html_content = f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет о валидации ресурсов</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 10px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }}
        .stat {{
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border-left: 4px solid #2196F3;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #2196F3;
        }}
        .stat-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }}
        .ok {{ border-left-color: #4CAF50; color: #4CAF50; }}
        .warning {{ border-left-color: #FF9800; color: #FF9800; }}
        .error {{ border-left-color: #f44336; color: #f44336; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th {{
            background-color: #2196F3;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }}
        td {{
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .status-ok {{
            background-color: #c8e6c9;
            color: #2e7d32;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }}
        .status-warning {{
            background-color: #ffe0b2;
            color: #e65100;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }}
        .status-error {{
            background-color: #ffcdd2;
            color: #c62828;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }}
        .description {{
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }}
        footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Отчет о валидации ресурсов</h1>

        <div class="summary">
            <div class="stat ok">
                <div class="stat-value">{summary["ok"]}</div>
                <div class="stat-label">ОК</div>
            </div>
            <div class="stat warning">
                <div class="stat-value">{summary["needs_update"]}</div>
                <div class="stat-label">Требует обновления</div>
            </div>
            <div class="stat error">
                <div class="stat-value">{summary["mismatch"]}</div>
                <div class="stat-label">Несоответствие</div>
            </div>
            <div class="stat">
                <div class="stat-value">{summary["avg_confidence"]:.0%}</div>
                <div class="stat-label">Средняя точность</div>
            </div>
        </div>

        <h2>Результаты</h2>
        <table>
            <thead>
                <tr>
                    <th>ID ресурса</th>
                    <th>Статус</th>
                    <th>Точность</th>
                    <th>Описание</th>
                    <th>Рекомендация</th>
                </tr>
            </thead>
            <tbody>
"""

            for record in records:
                status = record.get("validation_status", "ERROR")
                status_class = f"status-{status.lower()}"

                html_content += f"""                <tr>
                    <td><code>{record.get("resource_id", "")}</code></td>
                    <td><span class="{status_class}">{status}</span></td>
                    <td>{record.get("confidence", 0):.0%}</td>
                    <td><div class="description">{record.get("current_description", "")}</div></td>
                    <td>{record.get("reasoning", "")}</td>
                </tr>
"""

            html_content += (
                """            </tbody>
        </table>

        <footer>
            <p>Отчет создан """
                + datetime.now().strftime("%d.%m.%Y %H:%M:%S")
                + """</p>
        </footer>
    </div>
</body>
</html>
"""
            )

            with filepath.open("w", encoding="utf-8") as f:
                f.write(html_content)

            logger.info(f"✅ HTML отчет создан: {filepath}")
            return filepath

        except Exception as e:
            logger.error(f"Ошибка при генерации HTML: {e}")
            raise

    def _generate_summary(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        """Генерирует сводку по записям"""
        statuses = [r.get("validation_status", "ERROR") for r in records]
        confidences = [r.get("confidence", 0) for r in records]

        return {
            "ok": sum(1 for s in statuses if s == "OK"),
            "needs_update": sum(1 for s in statuses if s == "NEEDS_UPDATE"),
            "mismatch": sum(1 for s in statuses if s == "MISMATCH"),
            "error": sum(1 for s in statuses if s == "ERROR"),
            "avg_confidence": sum(confidences) / len(confidences) if confidences else 0,
            "total": len(records),
        }
