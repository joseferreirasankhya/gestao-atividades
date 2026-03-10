WITH DADOS AS (
    SELECT
        CASE
            WHEN (SELECT COUNT(*) FROM CAD_ATIVIDADES) = 0 THEN 0
            ELSE (
                (
                    SELECT COUNT(*)
                    FROM CAD_ATIVIDADES
                    WHERE DATA_CONCLUSAO IS NOT NULL
                      AND DATA_CONCLUSAO <= PREVISAO_CONCLUSAO
                ) / (
                    SELECT COUNT(*)
                    FROM CAD_ATIVIDADES
                )
            ) * 100
        END AS PERCENTUAL
    FROM DUAL
)
SELECT
    ROUND(PERCENTUAL, 1) AS PERCENTUAL,
    CASE
        WHEN PERCENTUAL < 50 THEN '#f8c7bf'
        WHEN PERCENTUAL >= 50 AND PERCENTUAL < 80 THEN '#f8ecbb'
        ELSE '#b6edb6'
    END AS COR
FROM DADOS