WITH CALENDARIO_REF AS (
    SELECT DISTINCT
        DATE_FORMAT(STR_TO_DATE(CAST(ID AS CHAR), '%Y%m%d'), '%Y%m01') AS ID_CALENDARIO
    FROM CAD_CALENDARIO
    WHERE ID BETWEEN DATE_FORMAT(:DT_INICIO, '%Y%m%d')
                 AND DATE_FORMAT(:DT_FIM, '%Y%m%d')
),

-- Calcula o mês anterior de cada data em CALENDARIO_REF para filtrar CC_1333 sem aplicar função sobre a coluna
-- Usa aritmética inteira (mesmo padrão de gestao_vista_donuts.sql) para evitar funções de data
CALENDARIO_MRR AS (
    SELECT
        CASE
            WHEN SUBSTRING(ID_CALENDARIO, 5, 2) = '01'
                THEN CAST(CAST(ID_CALENDARIO AS UNSIGNED) - 8900 AS CHAR)
            ELSE CAST(CAST(ID_CALENDARIO AS UNSIGNED) - 100 AS CHAR)
        END AS ID_CALENDARIO_MRR
    FROM CALENDARIO_REF
),

-- Materializa os parceiros do usuário uma única vez, evitando EXISTS correlacionado por linha
PARCEIROS_USUARIO AS (
    SELECT DISTINCT ID_PARCEIRO
    FROM CC_1609
    WHERE ID_USUARIOS = :ID_USUARIOS
),

-- Leitura única de CC_1512 + CAD_10931 + CAD_1007 para ID_METAS_CS = 3 (MRR Churn)
METAS_BASE AS (
    SELECT
        cal.ID_CALENDARIO,
        cal.ID_UNIDADE,
        cal.METAS_CS__META_UNIDADE,
        uni.ID_CS_MATRIZ
    FROM CC_1512 cal
    INNER JOIN CAD_10931 cad
        ON cad.ID = cal.ID_METAS_CS__GERENCIAMENTO_DE_METAS
    INNER JOIN CAD_1007 uni
        ON uni.ID = cal.ID_UNIDADE
    WHERE cad.ID_METAS_CS = 3
),

ULTIMO_MES_ANO AS (
    SELECT
        MAX(mb.ID_CALENDARIO) AS ID_CALENDARIO_FINAL
    FROM METAS_BASE mb
    WHERE (
            mb.ID_CALENDARIO IN (:ID_CALENDARIO)
            OR mb.ID_CALENDARIO IN (SELECT ID_CALENDARIO FROM CALENDARIO_REF)
            OR 'Todos' IN (:ID_CALENDARIO)
          )
),

FILTRO_UNIDADE AS (
    SELECT
        COUNT(DISTINCT mb.ID_UNIDADE) AS QTD
    FROM METAS_BASE mb
    WHERE (
            mb.ID_UNIDADE IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
          )
      AND (
            mb.ID_CS_MATRIZ IN (:ID_CS_MATRIZ)
            OR 'Todos' IN (:ID_CS_MATRIZ)
          )
),

ULTIMO_MES AS (
    SELECT
        MAX(mb.ID_CALENDARIO) AS ID_CALENDARIO_FINAL
    FROM METAS_BASE mb
    WHERE (
            mb.ID_CALENDARIO IN (:ID_CALENDARIO)
            OR mb.ID_CALENDARIO IN (SELECT ID_CALENDARIO FROM CALENDARIO_REF)
            OR 'Todos' IN (:ID_CALENDARIO)
          )
      AND (
            mb.ID_UNIDADE IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
          )
      AND (
            mb.ID_CS_MATRIZ IN (:ID_CS_MATRIZ)
            OR 'Todos' IN (:ID_CS_MATRIZ)
          )
),

META_UNIDADE AS (
    SELECT
        AVG(mb.METAS_CS__META_UNIDADE) AS VALOR_META
    FROM METAS_BASE mb
    INNER JOIN ULTIMO_MES um
        ON um.ID_CALENDARIO_FINAL = mb.ID_CALENDARIO
    WHERE (
            mb.ID_UNIDADE IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
          )
      AND (
            mb.ID_CS_MATRIZ IN (:ID_CS_MATRIZ)
            OR 'Todos' IN (:ID_CS_MATRIZ)
          )
),

REGRA_FIXA AS (
    SELECT
        CASE
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2026' THEN 0.7
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2025' THEN 0.8
            WHEN LEFT(uma.ID_CALENDARIO_FINAL, 4) = '2024' THEN 1
            ELSE 1
        END AS VALOR_META
    FROM ULTIMO_MES_ANO uma
),

PREVISTO AS (
    SELECT
        CASE
            WHEN fu.QTD = 1 THEN COALESCE(mu.VALOR_META, rf.VALOR_META)
            ELSE rf.VALOR_META
        END AS PREVISTO
    FROM REGRA_FIXA rf
    LEFT JOIN META_UNIDADE mu
        ON 1 = 1
    CROSS JOIN FILTRO_UNIDADE fu
),

REALIZADO AS (
    SELECT
        (SUM(A.PERDAS) / NULLIF(SUM(A.BASE_MRR), 0)) * 100 AS REALIZADO
    FROM (
        SELECT
            SUM(PER.VLR_PERDA_MRR_CHURN) AS PERDAS,
            0 AS BASE_MRR
        FROM CC_1671 PER
        INNER JOIN CAD_1006 PAR
            ON PAR.ID = PER.ID_PARCEIRO
        INNER JOIN CAD_1007 UNI
            ON UNI.ID = PER.ID_UNIDADE
        -- TRIM removido: assume-se que ID_TIPO_DE_PERDA não possui espaços extras nos dados
        WHERE PER.ID_TIPO_DE_PERDA = 'DEFINITIVO'
          AND (
                PER.ID_CALENDARIO IN (SELECT ID_CALENDARIO FROM CALENDARIO_REF)
                OR PER.ID_CALENDARIO IN (:ID_CALENDARIO)
                OR 'Todos' IN (:ID_CALENDARIO)
              )
          AND (
                PER.ID_PARCEIRO IN (:ID_PARCEIRO)
                OR 'Todos' IN (:ID_PARCEIRO)
              )
          AND (
                PER.ID_UNIDADE IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
              )
          AND (
                PAR.ID_SEGMENTO_PRINCIPAL IN (:ID_SEGMENTO_PRINCIPAL)
                OR 'Todos' IN (:ID_SEGMENTO_PRINCIPAL)
              )
          AND (
                PAR.ID_SEGMENTACAO_ATUAL IN (:ID_CLASSIFICACAO.SEGMENTACAO_ATUAL)
                OR 'Todos' IN (:ID_CLASSIFICACAO.SEGMENTACAO_ATUAL)
              )
          AND (
                UNI.ID_CS_MATRIZ IN (:ID_CS_MATRIZ)
                OR 'Todos' IN (:ID_CS_MATRIZ)
              )
          AND (
                UNI.ID_TIPO_UNIDADE IN (:ID_TIPO_UNIDADE)
                OR 'Todos' IN (:ID_TIPO_UNIDADE)
              )
          AND (
                PER.ID_PARCEIRO IN (SELECT ID_PARCEIRO FROM PARCEIROS_USUARIO)
                OR 'Todos' IN (:ID_USUARIOS)
              )

        UNION ALL

        SELECT
            0 AS PERDAS,
            SUM(MRR.MRR_HISTORICO) AS BASE_MRR
        FROM CC_1333 MRR
        INNER JOIN CAD_1006 PAR
            ON PAR.ID = MRR.ID_PARCEIRO
        INNER JOIN CAD_1007 UNI
            ON UNI.ID = MRR.ID_UNIDADE
        -- Filtro invertido: função aplicada sobre CALENDARIO_MRR (poucos registros), não sobre cada linha de CC_1333
        WHERE MRR.ID_CALENDARIO IN (SELECT ID_CALENDARIO_MRR FROM CALENDARIO_MRR)
          AND (
                MRR.ID_PARCEIRO IN (:ID_PARCEIRO)
                OR 'Todos' IN (:ID_PARCEIRO)
              )
          AND (
                MRR.ID_UNIDADE IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
              )
          AND (
                PAR.ID_SEGMENTO_PRINCIPAL IN (:ID_SEGMENTO_PRINCIPAL)
                OR 'Todos' IN (:ID_SEGMENTO_PRINCIPAL)
              )
          AND (
                PAR.ID_SEGMENTACAO_ATUAL IN (:ID_CLASSIFICACAO.SEGMENTACAO_ATUAL)
                OR 'Todos' IN (:ID_CLASSIFICACAO.SEGMENTACAO_ATUAL)
              )
          AND (
                UNI.ID_CS_MATRIZ IN (:ID_CS_MATRIZ)
                OR 'Todos' IN (:ID_CS_MATRIZ)
              )
          AND (
                UNI.ID_TIPO_UNIDADE IN (:ID_TIPO_UNIDADE)
                OR 'Todos' IN (:ID_TIPO_UNIDADE)
              )
          AND (
                MRR.ID_PARCEIRO IN (SELECT ID_PARCEIRO FROM PARCEIROS_USUARIO)
                OR 'Todos' IN (:ID_USUARIOS)
              )
    ) A
),

ATINGIMENTO AS (
    SELECT
        CASE
            WHEN COALESCE(p.PREVISTO, 0) = 0 THEN NULL
            ELSE (((p.PREVISTO - ROUND(r.REALIZADO, 2)) / p.PREVISTO) + 1) * 100
        END AS ATINGIMENTO
    FROM PREVISTO p
    CROSS JOIN REALIZADO r
)

SELECT
    ROUND(p.PREVISTO, 2) AS PREVISTO,
    ROUND(COALESCE(r.REALIZADO, 0), 2) AS REALIZADO,
    ROUND(a.ATINGIMENTO, 2) AS ATINGIMENTO
FROM PREVISTO p
CROSS JOIN REALIZADO r
CROSS JOIN ATINGIMENTO a;
