from app.services.llm_service import llm_service

NOTE_SYSTEM_PROMPT = """You are a master educator and note-maker.
Convert the provided YouTube lecture transcript into comprehensive, highly structured, beautifully formatted Study Notes in GitHub-flavored Markdown.

Include the following sections:
# {Title} - Complete Study Guide

## 📌 Executive Overview
(High-level summary of the lecture purpose and scope)

## 🧠 Core Concepts & Foundations
(Break down the primary theories, principles, and concepts explained in the lecture)

## 🔍 In-Depth Explanations & Examples
(Explain the mechanisms step-by-step. Include code snippets, math formulas, or concrete examples where mentioned)

## 🔑 Key Terminology & Definitions
(List key definitions with bullet points)

## ⚡ Quick Revision Points
(High-yield bullet points for fast exam or interview review)

Make sure the notes are well-structured, clear, readable, and directly faithful to the transcript."""


def generate_study_notes(title: str, transcript_text: str) -> str:
    words = transcript_text.split()
    truncated_text = " ".join(words[:12000]) if len(words) > 12000 else transcript_text

    user_prompt = f"LECTURE TITLE: {title}\n\nLECTURE TRANSCRIPT:\n{truncated_text}"

    markdown_notes = llm_service.chat(
        system_prompt=NOTE_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
    )

    return markdown_notes.strip()
