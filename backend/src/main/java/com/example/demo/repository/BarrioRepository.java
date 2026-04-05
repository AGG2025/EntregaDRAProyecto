package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import com.example.demo.entity.Barrio;

@RepositoryRestResource(path = "barrios", collectionResourceRel = "barrios")
public interface BarrioRepository extends CrudRepository<Barrio, Long> {

    Optional<Barrio> findByNombreIgnoreCase(String nombre);
}
