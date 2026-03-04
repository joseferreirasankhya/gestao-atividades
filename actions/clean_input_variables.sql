DELETE FROM INT_CUSTOMVARIABLECONTENT 
WHERE USERID = :VAR_USER 
    AND CUSTOMVARIABLEID IN (
        SELECT ID 
        FROM INT_CUSTOMVARIABLE 
        WHERE NAME IN (
            ':VAR_ATIV_TITULO',
            ':VAR_ATIV_DT_INICIO', 
            ':VAR_ATIV_DT_PREV_CON', 
            ':VAR_ATIV_DT_CONCLUSAO', 
            ':VAR_ATIV_HORAS',
            ':VAR_ATIV_PARCEIRO', 
            ':VAR_ATIV_RESPONSAVEL', 
            ':VAR_ATIV_TIPO', 
            ':VAR_ATIV_CATEGORIA', 
            ':VAR_ATIV_ANOTACOES')
        );
