-- COLUNAS
-- CAD_10929 = Atividades
-- CAD_10967 = Playbooks
-- CAD_1006 = Parceiro

SELECT
    'REVERSÃO' AS TITULO,
    'CONCLUSÃO NO PRAZO:' AS SUBTITULO,
    (
        SELECT COUNT(*)
        FROM (
            SELECT PB.ID
            FROM CAD_10967 PB
            JOIN CAD_10929 ATIV ON PB.ID = ATIV.ID_PLAYBOOKS
            WHERE PB.ID_TIPO_DE_PLAYBOOK = 2
            GROUP BY PB.ID
            HAVING SUM(
                CASE
                    WHEN ATIV.DATA_CONCLUSAO IS NULL
                      OR ATIV.DATA_CONCLUSAO > ATIV.PREVISAO_CONCLUSAO THEN 1
                    ELSE 0
                END
            ) = 0
        ) AS PlaybooksConcluidosNoPrazo
    ) AS REALIZADO,
    (
        SELECT COUNT(ID)
        FROM CAD_10967
        WHERE ID_TIPO_DE_PLAYBOOK = 2
    ) AS PREVISTO
FROM DUAL
