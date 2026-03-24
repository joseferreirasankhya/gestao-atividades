-- COLUNAS
-- CAD_10929 = Atividades
-- CAD_10967 = Playbooks
-- CAD_1006  = Parceiro

CREATE OR REPLACE VIEW VW_GSC_PASS_BASTAO AS
WITH

-- -------------------------------------------------------
-- BASE: todos os playbooks de Passagem de Bastão com suas
-- atividades (sem filtros — filtragem ocorre no consumer)
-- -------------------------------------------------------
BASE AS (
  SELECT
    PB.ID                                    AS ID_PLAYBOOK,
    DATE_FORMAT(ATIV.DATA_INICIO, '%Y%m%d')  AS DATA_INICIO,
    PAR.ID_UNIDADE_DO_PARCEIRO_ATUAL         AS ID_UNIDADE,
    ATIV.ID_RESPONSAVEL                      AS ID_RESPONSAVEL,
    ATIV.DATA_CONCLUSAO,
    ATIV.PREVISAO_CONCLUSAO
  FROM CAD_10967 PB
  JOIN CAD_10929 ATIV ON PB.ID = ATIV.ID_PLAYBOOKS
  JOIN CAD_1006  PAR  ON ATIV.ID_CLIENTE = PAR.ID
  WHERE PB.ID_TIPO_DE_PLAYBOOK = 1 -- Passagem de Bastão
),

-- -------------------------------------------------------
-- KPI pré-calculado por playbook:
--   REALIZADO = 1 quando todas as atividades estão no prazo
--   PREVISTO  = 1 sempre (cada playbook conta como 1 meta)
-- -------------------------------------------------------
KPI_POR_PLAYBOOK AS (
  SELECT
    ID_PLAYBOOK,
    DATA_INICIO,
    ID_UNIDADE,
    ID_RESPONSAVEL,
    MAX(
      CASE
        WHEN DATA_CONCLUSAO IS NULL
          OR DATA_CONCLUSAO > PREVISAO_CONCLUSAO
        THEN 1
        ELSE 0
      END
    ) AS TEM_ATRASO
  FROM BASE
  GROUP BY
    ID_PLAYBOOK,
    DATA_INICIO,
    ID_UNIDADE,
    ID_RESPONSAVEL
)

SELECT
  DATA_INICIO,
  ID_UNIDADE,
  ID_RESPONSAVEL,
  CASE
    WHEN TEM_ATRASO = 0 THEN 1
    ELSE 0
  END AS REALIZADO,
  1 AS PREVISTO
FROM KPI_POR_PLAYBOOK;
