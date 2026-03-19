# Regras de uso
- Use a skill de Especialista de UX/UI para auxiliar no planejamento das telas e a skill de Dev Front-end Pleno para implementar o plano propriamente dito.

# Estrutura do projeto
```
gestao-atividades/
├── .agents/                        # Diretório com as skills para os agentes de código
│   └── skills/
│       ├── dev-front-pleno/
│       │   └── SKILL.md
│       └── especialista-ux-ui/
│           └── SKILL.md
├── actions/                        # Ações para execução no Analytics (backup)
│   ├── add_playbook.sql
│   ├── add_playbooks_tasks.sql
│   ├── add_task.sql
│   ├── clean_input_variables.sql
│   └── finish_task.sql
├── components/                     # Componentes de interface
│   ├── index.html
│   ├── index.test.html             # Arquivo principal
│   ├── atividades/                 # Módulo de gestão de atividades
│   │   ├── cards.html
│   │   ├── table.tsx
│   │   ├── kpis/                   # KPIs do módulo de atividades
│   │   │   ├── queries/            # Queries SQL por tipo de KPI (backup)
│   │   │   │   ├── acomp_evol.sql
│   │   │   │   ├── acomp_inicial.sql
│   │   │   │   ├── checkin_exp.sql
│   │   │   │   ├── clube_gestao.sql
│   │   │   │   ├── conclusao_geral.sql
│   │   │   │   ├── entrega_digital.sql
│   │   │   │   ├── follow_detratores.sql
│   │   │   │   ├── follow_neutros.sql
│   │   │   │   ├── monitoramento_nps.sql
│   │   │   │   ├── outras_ativ.sql
│   │   │   │   ├── passagem_bastao.sql
│   │   │   │   └── reversao.sql
│   │   │   └── templates/          # Templates HTML por tipo de KPI (backup)
│   │   │       ├── acomp_evol.html
│   │   │       ├── acomp_inicial.html
│   │   │       ├── checkin_exp.html
│   │   │       ├── clube_gestao.html
│   │   │       ├── conclusao_geral.html
│   │   │       ├── entrega_digital.html
│   │   │       ├── follow_detratores.html
│   │   │       ├── follow_neutros.html
│   │   │       ├── monitoramento_nps.html
│   │   │       ├── outras_ativ.html
│   │   │       ├── passagem_bastao.html
│   │   │       └── reversao.html
│   │   └── queries/                # Queries SQL dos componentes de atividades
│   │       ├── cards.sql
│   │       └── table.sql
│   └── gestao_vista/               # Módulo de gestão à vista
│       ├── footer.html
│       ├── table.html
│       ├── kpis/                   # Registros dos KPIs da tela original de Gestão à Vista
│       │   └── kpi_cards.yml
│       └── value/                  # Queries SQL de valores/métricas
│           ├── clientes_ativos.sql
│           ├── mrr_total.sql
│           └── porte.sql
└── forms/                          # Formulários (vazio)
```