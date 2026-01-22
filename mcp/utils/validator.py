# mcp/utils/validator.py

"""
Модуль для валидации описаний ресурсов
"""

import logging
from typing import Any
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class ResourceValidator:
    """Класс для валидации соответствия описания контенту сайта"""

    def __init__(self):
        self.stop_words = {
            "и",
            "в",
            "на",
            "с",
            "по",
            "из",
            "к",
            "о",
            "а",
            "е",
            "ы",
            "у",
            "я",
            "для",
            "как",
            "то",
            "это",
            "все",
            "она",
            "так",
            "его",
            "них",
            "были",
            "быть",
            "является",
        }

    def validate(self, resource_id: str, current_description: str, webpage_content: str) -> dict[str, Any]:
        """
        Валидирует описание ресурса по контенту сайта

        Args:
            resource_id: ID ресурса
            current_description: Текущее описание
            webpage_content: Содержимое веб-страницы

        Returns:
            Словарь с результатами валидации
        """
        try:
            # Нормализуем текст
            desc_normalized = current_description.lower()
            content_normalized = webpage_content.lower()

            # 1. Ключевые слова (40%)
            keywords_score = self._calculate_keywords_match(desc_normalized, content_normalized)

            # 2. Строковое сравнение (40%)
            similarity_score = self._calculate_similarity(desc_normalized, content_normalized)

            # 3. Длина описания (20%)
            length_score = self._calculate_length_match(current_description, webpage_content)

            # Комбинированный скор
            total_score = keywords_score * 0.4 + similarity_score * 0.4 + length_score * 0.2

            # Определяем статус
            if total_score > 0.75:
                status = "OK"
                confidence = total_score
            elif total_score > 0.50:
                status = "NEEDS_UPDATE"
                confidence = total_score
            else:
                status = "MISMATCH"
                confidence = total_score

            logger.info(f"Валидация {resource_id}: {status} (score: {total_score:.2f})")

            return {
                "status": "success",
                "resource_id": resource_id,
                "validation_status": status,
                "confidence": round(confidence, 2),
                "scores": {
                    "keywords": round(keywords_score, 2),
                    "similarity": round(similarity_score, 2),
                    "length": round(length_score, 2),
                },
                "current_description": current_description,
                "suggested_description": self._generate_suggestion(current_description, webpage_content, status),
                "reasoning": self._get_reasoning(status, total_score),
            }

        except Exception as e:
            logger.error(f"Ошибка валидации {resource_id}: {e}")
            return {"status": "error", "resource_id": resource_id, "message": f"❌ Ошибка валидации: {e}"}

    def _calculate_keywords_match(self, description: str, content: str) -> float:
        """Оценивает совпадение ключевых слов (0-1)"""
        desc_words = {w for w in description.split() if len(w) > 3 and w not in self.stop_words}

        if not desc_words:
            return 0.5

        matches = sum(1 for word in desc_words if word in content)
        return matches / len(desc_words)

    def _calculate_similarity(self, description: str, content: str) -> float:
        """Оценивает строковое сходство (0-1) используя SequenceMatcher"""
        # Берем первые 500 символов для ускорения
        desc_short = description[:500]
        content_short = content[:500]

        ratio = SequenceMatcher(None, desc_short, content_short).ratio()
        return ratio

    def _calculate_length_match(self, description: str, content: str) -> float:
        """Оценивает адекватность длины описания (0-1)"""
        desc_len = len(description)
        content_len = len(content)

        # Описание должно быть 50-200 символов
        if desc_len < 30:
            desc_score = 0.3
        elif desc_len < 50:
            desc_score = 0.5
        elif desc_len < 200:
            desc_score = 1.0
        elif desc_len < 500:
            desc_score = 0.8
        else:
            desc_score = 0.5

        # Описание должно быть < 5% от контента
        if content_len > 0:
            ratio = desc_len / content_len
            if ratio < 0.05:
                ratio_score = 1.0
            elif ratio < 0.1:
                ratio_score = 0.8
            else:
                ratio_score = 0.5
        else:
            ratio_score = 0.5

        return (desc_score + ratio_score) / 2

    def _generate_suggestion(self, current: str, content: str, status: str) -> str:
        """Генерирует предложение нового описания"""
        if status == "OK":
            return ""

        # Извлекаем первые 2-3 предложения из контента
        sentences = content.split(".")

        suggestion = ""
        total_len = 0

        for sentence in sentences:
            sentence_stripped = sentence.strip()
            if len(sentence_stripped) > 20 and total_len < 150:
                suggestion += sentence_stripped + ". "
                total_len += len(sentence_stripped)

                if total_len >= 100:
                    break

        return suggestion[:200] if suggestion else current

    def _get_reasoning(self, status: str, score: float) -> str:
        """Возвращает объяснение статуса"""
        if status == "OK":
            return f"Описание хорошо совпадает с контентом сайта (совпадение {score * 100:.0f}%)"
        elif status == "NEEDS_UPDATE":
            return f"Описание требует уточнения. Совпадение {score * 100:.0f}% указывает на частичное несоответствие"
        else:
            return f"Описание не соответствует контенту. Требуется переписание (совпадение только {score * 100:.0f}%)"
