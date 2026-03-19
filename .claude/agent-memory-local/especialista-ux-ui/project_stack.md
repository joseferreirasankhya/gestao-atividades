---
name: Stack e arquitetura do projeto
description: Gestao de Atividades usa HTML vanilla + TailwindCSS CDN + Lucide Icons, nao React. Design system via CSS custom properties.
type: project
---

O projeto "Gestao de Atividades" e um dashboard interno da Sankhya para Gestao de Sucesso do Cliente.

**Stack real**: HTML puro (nao React), TailwindCSS via CDN (3.4.1), Lucide Icons, Tippy.js, PopperJS, SheetJS (xlsx). Fonte: Work Sans.

**Why:** O usuario menciona React no pedido, mas o codigo real e vanilla HTML. Importante nao assumir React ao implementar.

**How to apply:** Ao gerar codigo, usar HTML/CSS/JS vanilla. Ao dar handoff, referenciar os padroes CSS custom properties existentes (--primary, --border, --background, etc.) e as classes CSS ja definidas (kpi-card, btn-action, search-input, etc.).
