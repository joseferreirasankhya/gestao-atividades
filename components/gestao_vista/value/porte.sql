/* ============================================================
   MÉTRICA: CLASSIFICAÇÃO POR PORTE (Snapshot do último mês)
   ------------------------------------------------------------
   OBJETIVO:
   - Somar o MRR Ativo Total
   - Considerar apenas o ÚLTIMO mês do filtro
   - Excluir clientes Cancelados (código 6)
   - Classificar conforme regra de Porte
   - Respeitar filtro de Unidade
   ============================================================ */

SELECT

    /* ========================================================
       CLASSIFICAÇÃO DE PORTE
       --------------------------------------------------------
       A classificação é feita sobre o MRR TOTAL do mês.
       SUM executa antes do CASE (contexto agregado).
       ======================================================== */
       
    CASE
        WHEN SUM(H.MRR_SK_ATIVO_HIST) > 2500000 THEN 'Porte XG'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 1000000 
             AND SUM(H.MRR_SK_ATIVO_HIST) <= 2500000 THEN 'Porte GG'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 600000 
             AND SUM(H.MRR_SK_ATIVO_HIST) < 1000000 THEN 'Porte G'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) >= 200000 
             AND SUM(H.MRR_SK_ATIVO_HIST) < 600000 THEN 'Porte M'
        WHEN SUM(H.MRR_SK_ATIVO_HIST) < 200000 THEN 'Porte P'
        ELSE 'Não classificado'
    END AS PORTE,

    /* --------------------------------------------------------
       Valor total do MRR para auditoria da classificação
       -------------------------------------------------------- */
    ROUND(SUM(H.MRR_SK_ATIVO_HIST), 2) AS MRR_TOTAL

FROM CC_MRR_SK_ATIVO_HIST H

WHERE

    /* ========================================================
       REGRA 1: SNAPSHOT DO ÚLTIMO MÊS
       --------------------------------------------------------
       O MAX(ID_CALENDARIO) deve respeitar:
       - Filtro de data
       - Filtro de unidade
       ======================================================== */
       
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

    /* ========================================================
       REGRA 2: EXCLUIR CANCELADOS
       ======================================================== */
    AND H.ID_STATUS_CLIENTE <> 6

    /* ========================================================
       REGRA 3: FILTRO DE UNIDADE NA QUERY PRINCIPAL
       --------------------------------------------------------
       Garante que a soma respeite as unidades selecionadas.
       ======================================================== */
    AND (
        H.ID_UNIDADE IN (:ID_UNIDADE)
        OR 'Todos' IN (:ID_UNIDADE)
    )
;
