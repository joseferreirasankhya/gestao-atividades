SELECT
    'OUTRAS ATIVIDADES' AS TITULO,
    'CONCLUSÃO NO PRAZO:' AS SUBTITULO,
    (
        SELECT COUNT(*)
        FROM (
            SELECT PB.ID
            FROM CAD_PLAYBOOKS PB
            JOIN CAD_ATIVIDADES ATIV ON PB.ID = ATIV.ID_PLAYBOOKS
            WHERE PB.ID_TIPO_DE_PLAYBOOK = 1
               OR PB.ID_TIPO_DE_PLAYBOOK = -999
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
        FROM CAD_PLAYBOOKS
        WHERE ID_TIPO_DE_PLAYBOOK = 1
           OR ID_TIPO_DE_PLAYBOOK = -999
    ) AS PREVISTO
FROM DUAL
