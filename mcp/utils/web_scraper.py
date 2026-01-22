# mcp/utils/web_scraper.py

"""
Модуль для захвата веб-страниц
"""

import asyncio
import logging
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class WebScraper:
    """Класс для захвата содержимого веб-страниц"""

    def __init__(self, timeout: int = 10, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ]

    async def fetch_url(self, url: str, max_chars: int = 3000) -> str:
        """
        Асинхронно захватывает содержимое URL

        Args:
            url: URL страницы
            max_chars: Максимум символов в ответе

        Returns:
            Текстовое содержимое страницы

        Raises:
            TimeoutError: Если запрос превысит timeout
            Exception: При других ошибках сети
        """
        for attempt in range(self.max_retries):
            try:
                logger.debug(f"Попытка {attempt + 1}/{self.max_retries}: {url}")

                headers = {
                    "User-Agent": self.user_agents[attempt % len(self.user_agents)],
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ru-RU,ru;q=0.9",
                }

                async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                    response = await client.get(url, headers=headers, follow_redirects=True)
                    response.raise_for_status()

                    # Парсим HTML
                    soup = BeautifulSoup(response.content, "html.parser")

                    # Удаляем ненужные теги
                    for tag in soup(["script", "style", "nav", "footer", "noscript"]):
                        tag.decompose()

                    # Извлекаем текст
                    text = soup.get_text(separator="\n", strip=True)

                    # Ограничиваем размер
                    result = text[:max_chars]

                    logger.info(f"✅ Успешно загружен {url} ({len(result)} символов)")
                    return result

            except TimeoutError:
                logger.warning(f"Таймаут при загрузке {url} (попытка {attempt + 1})")
                if attempt == self.max_retries - 1:
                    raise TimeoutError(f"Таймаут после {self.max_retries} попыток")
                await asyncio.sleep(2**attempt)  # Exponential backoff

            except httpx.HTTPStatusError as e:
                logger.warning(f"HTTP ошибка {e.response.status_code}: {url}")
                if e.response.status_code == 429:  # Rate limit
                    await asyncio.sleep(5)
                elif attempt == self.max_retries - 1:
                    raise
                else:
                    await asyncio.sleep(2)

            except Exception as e:
                logger.warning(f"Ошибка при загрузке {url}: {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(1)

        raise Exception(f"Не удалось загрузить {url} после {self.max_retries} попыток")

    def fetch_sync(self, url: str, max_chars: int = 3000) -> str:
        """
        Синхронная версия fetch_url для использования в не-async контексте
        """
        return asyncio.run(self.fetch_url(url, max_chars))
