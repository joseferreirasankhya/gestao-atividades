/* ============================================================
   MÉTRICA: MRR_ATIVO_TOTAL_FORMATADO
   ------------------------------------------------------------
   OBJETIVO:
   - Calcular o MRR Ativo Total
   - Considerar apenas o ÚLTIMO mês selecionado no filtro
   - Respeitar filtro de Unidade
   - Retornar valor formatado em moeda brasileira (R$)

   IMPORTANTE:
   - O resultado final é TEXTO (string)
   - Não deve ser utilizado para novos cálculos
   ============================================================ */

/* =========================================================
    BLOCO DE FORMATAÇÃO DO VALOR
    --------------------------------------------------------
    1) SUM(H.MRR_SK_ATIVO_HIST)
        → Soma o MRR de todos os registros do mês snapshot

    2) ROUND(..., 2)
        → Garante precisão de 2 casas decimais

    3) FORMAT(..., 2, 'pt_BR')
        → Aplica:
            - Separador de milhar com ponto
            - Separador decimal com vírgula

    4) CONCAT('R$ ', ...)
        → Adiciona símbolo da moeda brasileira

    OBS:
    Essa construção transforma o resultado numérico
    em STRING para exibição em dashboard.
    ======================================================== */

/* ============================================================
   TABELA FONTE
   ------------------------------------------------------------
   CC_MRR_SK_ATIVO_HIST
   → Tabela histórica de MRR Ativo por mês (snapshot mensal)

   Alias:
   H = Histórico principal
   ============================================================ */

/* =========================================================
    REGRA DE SNAPSHOT (MÊS FINAL DO FILTRO)
    --------------------------------------------------------
    A métrica deve sempre considerar:
    → O maior ID_CALENDARIO dentro do filtro aplicado

    Isso garante comportamento de "foto do último mês"
    independentemente do intervalo selecionado.
    ======================================================== */

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
        /* ----------------------------------------------------
           Subquery responsável por identificar
           o último mês válido dentro do contexto filtrado
           ---------------------------------------------------- */
        SELECT MAX(H2.ID_CALENDARIO)
        FROM CC_MRR_SK_ATIVO_HIST H2
        WHERE
            /* -----------------------------------------------
               Filtro de Calendário
               ------------------------------------------------
               MITRA envia:
               - Lista de datas (:ID_CALENDARIO)
               OU
               - Palavra 'Todos'

               Se for "Todos", ignora restrição de data.
               ----------------------------------------------- */
            (
                H2.ID_CALENDARIO IN (:ID_CALENDARIO)
                OR 'Todos' IN (:ID_CALENDARIO)
            )

            /* -----------------------------------------------
               Filtro de Unidade aplicado também
               na definição do mês snapshot.

               Isso garante que o MAX(ID_CALENDARIO)
               seja coerente com as unidades filtradas.

               Evita inconsistência de snapshot.
               ----------------------------------------------- */
            AND (
                H2.ID_UNIDADE IN (:ID_UNIDADE)
                OR 'Todos' IN (:ID_UNIDADE)
            )
    )

    /* ========================================================
       FILTRO DE UNIDADE NA QUERY PRINCIPAL
       --------------------------------------------------------
       Necessário para:
       - Garantir que a soma respeite as unidades selecionadas
       - Evitar trazer registros fora do contexto

       Mesmo já aplicado na subquery,
       deve ser reaplicado aqui para consistência.
       ======================================================== */
       
    AND (
        H.ID_UNIDADE IN (:ID_UNIDADE)
        OR 'Todos' IN (:ID_UNIDADE)
    )
;
