package com.example.demo.repository;

import org.springframework.data.rest.core.config.Projection;
import org.springframework.beans.factory.annotation.Value;
import com.example.demo.entity.Propiedad;

@Projection(name = "propiedadConBarrio", types = { Propiedad.class })
public interface PropiedadProjection {
    Long getId();
    String getTitulo();
    String getPrecio();
    String getDetalles();
    String getDescripcionCorta();
    String getUrl();

    @Value("#{target.barrio.nombre}")
    String getBarrio();
}
