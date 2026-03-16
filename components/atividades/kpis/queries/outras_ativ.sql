SELECT
    'OUTRAS ATIVIDADES' AS TITULO,
    'CONCLUSÃO NO PRAZO:' AS SUBTITULO,
    (
        SELECT COUNT(*)
        FROM (
            SELECT PB.ID
            FROM CAD_PLAYBOOKS PB
            JOIN CAD_ATIVIDADES ATIV ON PB.ID = ATIV.ID_PLAYBOOKS
            JOIN CAD_PARCEIRO PAR ON ATIV.ID_CLIENTE = PAR.ID
            WHERE PB.ID_TIPO_DE_PLAYBOOK IN (5, -999) AND (
                DATE_FORMAT (ATIV.DATA_INICIO, '%Y%m%d') IN (:ID_CALENDARIO)
                OR 'Todos' IN (:ID_CALENDARIO)
            ) AND (
                PAR.ID_UNIDADE_DO_PARCEIRO_ATUAL IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
            )
            GROUP BY PB.ID
            HAVING SUM(
                CASE
                    -- CORREÇÃO: Marcar com '1' se a atividade não foi concluída OU foi concluída com atraso.
                    WHEN ATIV.DATA_CONCLUSAO IS NULL OR ATIV.DATA_CONCLUSAO > ATIV.PREVISAO_CONCLUSAO THEN 1
                    ELSE 0
                END
            ) = 0
        ) AS PlaybooksConcluidosNoPrazo
    ) AS REALIZADO,
    (
        -- Adicionado DISTINCT para contar playbooks únicos
        SELECT COUNT(DISTINCT PB.ID)
        FROM CAD_PLAYBOOKS PB
        JOIN CAD_ATIVIDADES ATIV ON PB.ID = ATIV.ID_PLAYBOOKS
        JOIN CAD_PARCEIRO PAR ON ATIV.ID_CLIENTE = PAR.ID
        WHERE PB.ID_TIPO_DE_PLAYBOOK IN (5, -999) AND (
            DATE_FORMAT (ATIV.DATA_INICIO, '%Y%m%d') IN (:ID_CALENDARIO)
            OR 'Todos' IN (:ID_CALENDARIO)
        ) AND (
            PAR.ID_UNIDADE_DO_PARCEIRO_ATUAL IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
        )
    ) AS PREVISTO
FROM DUAL