package com.example.demo.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.example.demo.entity.Propiedad;

@RepositoryRestResource(path = "propiedades", collectionResourceRel = "propiedades", excerptProjection = PropiedadProjection.class)
public interface PropiedadRepository extends CrudRepository<Propiedad, Long> {
}
