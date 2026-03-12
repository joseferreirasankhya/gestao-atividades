

/* ============================================================
   MÉTRICA: CLIENTES_ATIVOS_MES_FINAL
   ------------------------------------------------------------
   OBJETIVO:
   - Contar clientes distintos (ID_PARCEIRO)
   - Considerar apenas clientes ATIVOS (≠ cancelado)
   - Considerar apenas o último mês do filtro
   - Respeitar filtro de Unidade
   ============================================================ */

SELECT 

    /* --------------------------------------------------------
       COUNT DISTINCT
       --------------------------------------------------------
       Garante que o mesmo cliente não seja contado
       mais de uma vez dentro do mês snapshot.
       -------------------------------------------------------- */
    COUNT(DISTINCT C.ID_PARCEIRO) AS clientes_ativos_mes_final

FROM CC_1325 C

WHERE

    /* --------------------------------------------------------
       Regra de negócio:
       6 = Cancelado
       Excluímos clientes cancelados do cálculo.
       -------------------------------------------------------- */
    C.ID_STATUS_CLIENTE <> 6

    /* ========================================================
       REGRA DE SNAPSHOT
       --------------------------------------------------------
       Pega o maior ID_CALENDARIO dentro do contexto filtrado.
       Isso garante sempre o mês final selecionado.
       ======================================================== */
    AND C.ID_CALENDARIO = (

        SELECT MAX(C2.ID_CALENDARIO)

        FROM CC_1325 C2

        WHERE
            /* -----------------------------------------------
               Filtro de calendário padrão MITRA
               ----------------------------------------------- */
            (
                C2.ID_CALENDARIO IN (:ID_CALENDARIO)
                OR 'Todos' IN (:ID_CALENDARIO)
            )

            /* -----------------------------------------------
               Filtro de Unidade aplicado também
               na definição do mês snapshot.
               Isso evita inconsistência entre mês e unidade.
               ----------------------------------------------- */
            AND (
                C2.ID_UNIDADE IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
            )
    )

    /* --------------------------------------------------------
       Filtro de Unidade na query principal
       Necessário para garantir coerência do resultado.
       -------------------------------------------------------- */
    AND (
        C.ID_UNIDADE IN (:ID_UNIDADE)
        OR 'Todos' IN (:ID_UNIDADE)
    )
;
