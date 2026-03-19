WITH MRR_TOTAL AS (
    SELECT
        CONCAT(
            'R$ ',
            FORMAT(
                ROUND(SUM(H.MRR_SK_ATIVO_HIST), 2),
                2,
                'pt_BR'
            )
        ) AS MRR_ATIVO_TOTAL
    FROM CC_MRR_SK_ATIVO_HIST H
    WHERE  
        H.ID_CALENDARIO = (   
            SELECT MAX(H2.ID_CALENDARIO)
            FROM CC_MRR_SK_ATIVO_HIST H2
            WHERE (
                H2.ID_CALENDARIO IN (:ID_CALENDARIO)
                OR 'Todos' IN (:ID_CALENDARIO)
            ) AND (
                H2.ID_UNIDADE IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
            )
    ) AND (
        H.ID_UNIDADE IN (:ID_UNIDADE)
        OR 'Todos' IN (:ID_UNIDADE)
    )
),
TOTAL_CLIENTES AS (
    SELECT COUNT(DISTINCT C.ID_PARCEIRO) AS total_clientes
    FROM CC_1325 C
    WHERE
        C.ID_CALENDARIO = (
            SELECT MAX(C2.ID_CALENDARIO)
            FROM CC_1325 C2
            WHERE
                (
                    C2.ID_CALENDARIO IN (:ID_CALENDARIO)
                    OR 'Todos' IN (:ID_CALENDARIO)
                )
                AND (
                    C2.ID_UNIDADE IN (:ID_UNIDADE)
                    OR 'Todos' IN (:ID_UNIDADE)
                )
        )
        AND (
            C.ID_UNIDADE IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
        )
),
PORTE AS (
    SELECT CASE
        WHEN SUM(H.MRR_SK_ATIVO_HIST) > 2500000 THEN 'XG'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 1000000 
             AND SUM(H.MRR_SK_ATIVO_HIST) <= 2500000 THEN 'GG'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 600000 
             AND SUM(H.MRR_SK_ATIVO_HIST) < 1000000 THEN 'G'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 200000 
             AND SUM(H.MRR_SK_ATIVO_HIST) < 600000 THEN 'M'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) < 200000 THEN 'P'
        ELSE 'Não classificado'
    END AS PORTE,
    ROUND(SUM(H.MRR_SK_ATIVO_HIST), 2) AS MRR_TOTAL
    FROM CC_MRR_SK_ATIVO_HIST H
    WHERE
        H.ID_CALENDARIO = (
            SELECT MAX(H2.ID_CALENDARIO)
            FROM CC_MRR_SK_ATIVO_HIST H2
            WHERE
                (
                    H2.ID_CALENDARIO IN (:ID_CALENDARIO)
                    OR 'Todos' IN (:ID_CALENDARIO)
                )
                AND (
                    H2.ID_UNIDADE IN (:ID_UNIDADE)
                    OR 'Todos' IN (:ID_UNIDADE)
                )
        )
        AND H.ID_STATUS_CLIENTE <> 6
        AND (
            H.ID_UNIDADE IN (:ID_UNIDADE)
            OR 'Todos' IN (:ID_UNIDADE)
        )
)
SELECT 
    (SELECT MRR_ATIVO_TOTAL FROM MRR_TOTAL) AS MRR_ATIVO_TOTAL,
    (SELECT total_clientes FROM TOTAL_CLIENTES) AS TOTAL_CLIENTES,
    (SELECT PORTE FROM PORTE) AS PORTE
