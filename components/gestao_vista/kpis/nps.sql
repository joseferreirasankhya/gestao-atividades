WITH ULTIMO_MES_ANO AS (
    SELECT MAX(cal.ID_CALENDARIO) AS ID_CALENDARIO_FINAL
    FROM CC_1512 cal
    INNER JOIN CAD_10931 cad
        ON cad.ID = cal.ID_METAS_CS__GERENCIAMENTO_DE_METAS
    WHERE cad.ID_METAS_CS = 2
      AND (cal.ID_CALENDARIO IN (:ID_CALENDARIO) OR 'Todos' IN (:ID_CALENDARIO))
),

FILTRO_ATIVO AS (
    SELECT
        CASE
            WHEN 'Todos' NOT IN (:ID_UNIDADE)  THEN 1
            WHEN 'Todos' NOT IN (:ID_CS_MATRIZ) THEN 1
            ELSE 0
        END AS TEM_FILTRO
),

BASE_FILTRADA AS (
    SELECT
        cal.ID_CALENDARIO,
        cal.ID_UNIDADE,
        cal.METAS_CS__META_UNIDADE AS VALOR_META
    FROM CC_1512 cal
    INNER JOIN CAD_10931 cad
        ON cad.ID = cal.ID_METAS_CS__GERENCIAMENTO_DE_METAS
    INNER JOIN CAD_1007 uni
        ON uni.ID = cal.ID_UNIDADE
    WHERE cad.ID_METAS_CS = 2
      AND (cal.ID_CALENDARIO IN (:ID_CALENDARIO) OR 'Todos' IN (:ID_CALENDARIO))
      AND (cal.ID_UNIDADE IN (:ID_UNIDADE) OR 'Todos' IN (:ID_UNIDADE))
      AND (uni.ID_CS_MATRIZ IN (:ID_CS_MATRIZ) OR 'Todos' IN (:ID_CS_MATRIZ))
),

ULTIMO_MES AS (
    SELECT MAX(ID_CALENDARIO) AS ID_CALENDARIO_FINAL
    FROM BASE_FILTRADA
),

META_REAL AS (
    SELECT AVG(bf.VALOR_META) AS VALOR_META
    FROM BASE_FILTRADA bf
    INNER JOIN ULTIMO_MES um ON um.ID_CALENDARIO_FINAL = bf.ID_CALENDARIO
),

REGRA_FIXA AS (
    SELECT 
        CASE
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2026' THEN 
                CASE 
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '01' AND '03' THEN 40
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '04' AND '06' THEN 42
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '07' AND '09' THEN 44
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '10' AND '12' THEN 48
                END             
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2025' THEN
                CASE
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '01' AND '03' THEN 42
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '04' AND '06' THEN 42
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '07' AND '09' THEN 40
                    WHEN SUBSTRING(uma.ID_CALENDARIO_FINAL, 5, 2) BETWEEN '10' AND '12' THEN 44
                END
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2024' THEN 30
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2023' THEN 25
        END AS VALOR_META
    FROM ULTIMO_MES_ANO uma 
),

NPS_PREVISTO AS (
    SELECT
        CASE
            WHEN fa.TEM_FILTRO = 1 THEN mr.VALOR_META
            ELSE rf.VALOR_META
        END AS NPS_RESULTADO
    FROM REGRA_FIXA rf
    LEFT JOIN META_REAL mr ON 1 = 1
    CROSS JOIN FILTRO_ATIVO fa
),

-- =====================================================================
-- MES_MAX_FILTRO
-- Identifica o mês mais recente e se há filtro de data ativo.
-- Sem filtro de data ('Todos') → QTD = 1 → usa só o último mês
-- Com filtro de data → QTD > 1 → usa todos os meses do filtro
-- =====================================================================
MES_MAX_FILTRO AS (
    SELECT
        MAX(r.ID_CALENDARIO)          AS CALENDARIO_MAX,
        LEFT(MAX(r.ID_CALENDARIO), 4) AS ANO_REF,
        CASE
            WHEN 'Todos' IN (:ID_CALENDARIO) THEN 1
            ELSE COUNT(DISTINCT r.ID_CALENDARIO)
        END                           AS QTD_MESES_FILTRO
    FROM CC_1424 r
    WHERE (r.ID_CALENDARIO IN (:ID_CALENDARIO) OR 'Todos' IN (:ID_CALENDARIO))
),

-- =====================================================================
-- MESES_JANELA_6
-- Para NPS Tradicional (com Unidade/Matriz).
-- Sem filtro de data → apenas o último mês
-- Com filtro de data → até 6 meses mais recentes no mesmo ano
--                      até o mês MAX do filtro
-- =====================================================================
MESES_JANELA_6 AS (
    SELECT mmf.CALENDARIO_MAX AS ID_CALENDARIO
    FROM MES_MAX_FILTRO mmf
    WHERE mmf.QTD_MESES_FILTRO = 1

    UNION

    SELECT me.ID_CALENDARIO
    FROM (
        SELECT
            r.ID_CALENDARIO,
            ROW_NUMBER() OVER (ORDER BY r.ID_CALENDARIO DESC) AS RN
        FROM (
            SELECT DISTINCT r2.ID_CALENDARIO
            FROM CC_1424 r2
            CROSS JOIN MES_MAX_FILTRO mmf
            WHERE LEFT(r2.ID_CALENDARIO, 4) = mmf.ANO_REF
              AND r2.ID_CALENDARIO <= mmf.CALENDARIO_MAX
              AND mmf.QTD_MESES_FILTRO > 1
        ) r
    ) me
    CROSS JOIN MES_MAX_FILTRO mmf
    WHERE me.RN <= 6
      AND mmf.QTD_MESES_FILTRO > 1
),

-- =====================================================================
-- NPS_PONDERADO_REALIZADO
-- Usado quando NÃO há filtro de Unidade/Matriz.
-- Fórmula: (SUM MRR Promotores - SUM MRR Detratores) / SUM MRR Total
-- Sem filtro de data → restringe ao último mês via CALENDARIO_MAX
-- Com filtro de data → todos os meses do filtro sem média móvel
-- =====================================================================
NPS_PONDERADO_REALIZADO AS (
    SELECT
        ROUND(
            (
                SUM(CASE WHEN r.ID_ESCALA_NPS IN (9, 10) THEN mrr.MRR_SK_ATIVO_HIST ELSE 0 END)
                - SUM(CASE WHEN r.ID_ESCALA_NPS <= 6     THEN mrr.MRR_SK_ATIVO_HIST ELSE 0 END)
            ) / NULLIF(SUM(mrr.MRR_SK_ATIVO_HIST), 0) * 100.0,
            0
        ) AS NPS
    FROM CC_1424 r
    LEFT JOIN CC_MRR_SK_ATIVO_HIST mrr
        ON mrr.ID_PARCEIRO   = r.ID_PARCEIRO
       AND mrr.ID_CALENDARIO = (
            SELECT MAX(m2.ID_CALENDARIO)
            FROM CC_MRR_SK_ATIVO_HIST m2
            WHERE m2.ID_PARCEIRO = r.ID_PARCEIRO
              AND LEFT(m2.ID_CALENDARIO, 6) = LEFT(r.ID_CALENDARIO, 6)
       )
    CROSS JOIN MES_MAX_FILTRO mmf
    WHERE (
            -- Sem filtro de data → restringe ao último mês
            (mmf.QTD_MESES_FILTRO = 1 AND r.ID_CALENDARIO = mmf.CALENDARIO_MAX)
            OR
            -- Com filtro de data → todos os meses do filtro
            (mmf.QTD_MESES_FILTRO > 1 AND (r.ID_CALENDARIO IN (:ID_CALENDARIO) OR 'Todos' IN (:ID_CALENDARIO)))
          )
      AND r.ID_CONTATO_PESQUISA_NPS IN (
            SELECT ID FROM CAD_8732
            WHERE ID_PESQUISA_NPS_INVALIDA = 'N'
          )
),

-- =====================================================================
-- NPS_REALIZADO_FILTRADO
-- Usado quando HÁ filtro de Unidade/Matriz.
-- Cálculo tradicional de NPS (contagem de votos).
-- Sem filtro de data → último mês
-- Com filtro de data → janela móvel de 6 meses mais recentes
-- =====================================================================
NPS_REALIZADO_FILTRADO AS (
    SELECT
        ROUND(
            (
                SUM(CASE WHEN r.ID_ESCALA_NPS IN (9, 10) THEN 1 ELSE 0 END)
                - SUM(CASE WHEN r.ID_ESCALA_NPS <= 6 THEN 1 ELSE 0 END)
            ) * 100.0 / NULLIF(COUNT(*), 0),
            0
        ) AS NPS
    FROM CC_1424 r
    INNER JOIN CC_1325 t3
        ON t3.ID_PARCEIRO = r.ID_PARCEIRO
       AND LEFT(t3.ID_CALENDARIO, 6) = LEFT(r.ID_CALENDARIO, 6)
    INNER JOIN CAD_1007 uni
        ON uni.ID = t3.ID_UNIDADE
    INNER JOIN MESES_JANELA_6 mj6
        ON mj6.ID_CALENDARIO = r.ID_CALENDARIO
    WHERE (t3.ID_UNIDADE IN (:ID_UNIDADE) OR 'Todos' IN (:ID_UNIDADE))
      AND (uni.ID_CS_MATRIZ IN (:ID_CS_MATRIZ) OR 'Todos' IN (:ID_CS_MATRIZ))
      AND r.ID_CONTATO_PESQUISA_NPS IN (
            SELECT ID FROM CAD_8732
            WHERE ID_PESQUISA_NPS_INVALIDA = 'N'
          )
),

-- =====================================================================
-- NPS_REALIZADO
-- TEM_FILTRO = 0 → NPS Ponderado MRR (sem janela móvel)
--               → Sem data: último mês
--               → Com data: todos os meses do filtro
-- TEM_FILTRO = 1 → NPS Tradicional por votos (janela móvel 6 meses)
--               → Sem data: último mês
--               → Com data: 6 meses mais recentes do filtro
-- =====================================================================
NPS_REALIZADO AS (
    SELECT
        CASE
            WHEN fa.TEM_FILTRO = 1 THEN nrf.NPS
            ELSE npd.NPS
        END AS NPS
    FROM NPS_PONDERADO_REALIZADO npd
    CROSS JOIN NPS_REALIZADO_FILTRADO nrf
    CROSS JOIN FILTRO_ATIVO fa
),

NPS_ATINGIMENTO AS (
    SELECT
        ROUND(
            COALESCE(nr.NPS, 0) / NULLIF(np.NPS_RESULTADO, 0) * 100.0,
            0
        ) AS NPS_ATINGIMENTO
    FROM NPS_REALIZADO nr
    CROSS JOIN NPS_PREVISTO np
)

SELECT
    NPS_PREVISTO.NPS_RESULTADO      AS PREVISTO,
    NPS_REALIZADO.NPS               AS REALIZADO,
    NPS_ATINGIMENTO.NPS_ATINGIMENTO AS ATINGIMENTO
FROM NPS_PREVISTO
CROSS JOIN NPS_REALIZADO
CROSS JOIN NPS_ATINGIMENTO;