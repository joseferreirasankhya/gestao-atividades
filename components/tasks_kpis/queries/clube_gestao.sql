SELECT
    'CLUBE DE GESTÃO' AS TITULO,
    'CASES APROVADOS:' AS SUBTITULO,
    (
        SELECT COUNT(*)
        FROM CC_1643
        WHERE CG_DT_APROVACAO_ IS NOT NULL
          AND (
              ID_CALENDARIO IN (:ID_CALENDARIO)
              OR 'Todos' IN (:ID_CALENDARIO)
          )
          AND (
              ID_UNIDADE IN (:ID_UNIDADE)
              OR 'Todos' IN (:ID_UNIDADE)
          )
    ) AS REALIZADO,
    (
        SELECT SUM(cal.METAS_CS__META_UNIDADE)
        FROM CC_1512 cal
        INNER JOIN CAD_10931 cad ON cad.ID = cal.ID_METAS_CS__GERENCIAMENTO_DE_METAS
        WHERE cad.ID_METAS_CS = 8
          AND (
              cal.ID_CALENDARIO IN (:ID_CALENDARIO)
              OR 'Todos' IN (:ID_CALENDARIO)
          )
          AND (
              cal.ID_UNIDADE IN (:ID_UNIDADE)
              OR 'Todos' IN (:ID_UNIDADE)
          )
    ) AS PREVISTO
FROM DUAL