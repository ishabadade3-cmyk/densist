"""Provider interfaces for AI and embeddings; adapters are supplied by deployment config."""

from __future__ import annotations

import os
from importlib import import_module
from typing import Protocol


class AIEmbeddingProvider(Protocol):
    model_name: str

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class AIModelProvider(Protocol):
    def generate(self, *, system_prompt: str, user_prompt: str, context: str) -> str: ...


class AIProviderUnavailable(Exception):
    """No approved model/embedding provider adapter is configured."""


def load_ai_providers() -> tuple[AIEmbeddingProvider, AIModelProvider]:
    target = os.getenv("AI_PROVIDER_FACTORY", "").strip()
    if not target:
        raise AIProviderUnavailable
    module_name, separator, factory_name = target.partition(":")
    if not separator or not module_name or not factory_name:
        raise AIProviderUnavailable
    try:
        factory = getattr(import_module(module_name), factory_name)
        embedding, model = factory()
        if not callable(getattr(embedding, "embed", None)) or not callable(getattr(model, "generate", None)):
            raise AIProviderUnavailable
        return embedding, model
    except AIProviderUnavailable:
        raise
    except Exception:
        # Adapter startup errors can contain secrets or request fragments; expose no details.
        raise AIProviderUnavailable from None
