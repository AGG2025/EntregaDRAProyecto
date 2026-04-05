package com.example.demo.bootstrap;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.example.demo.dto.PisoJson;
import com.example.demo.entity.Barrio;
import com.example.demo.entity.Propiedad;
import com.example.demo.repository.BarrioRepository;
import com.example.demo.repository.PropiedadRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class AlmeriaPisosLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AlmeriaPisosLoader.class);

    private final BarrioRepository barrioRepository;
    private final PropiedadRepository propiedadRepository;

    public AlmeriaPisosLoader(
            BarrioRepository barrioRepository,
            PropiedadRepository propiedadRepository) {
        this.barrioRepository = barrioRepository;
        this.propiedadRepository = propiedadRepository;
    }

    @Override
    public void run(String... args) {
        if (propiedadRepository.count() > 0) {
            return;
        }

        List<PisoJson> pisos = loadPisos();
        if (pisos.isEmpty()) {
            log.warn("No se encontraron datos en almeria_pisos.json");
            return;
        }

        Map<String, Barrio> barrioCache = new HashMap<>();

        for (PisoJson piso : pisos) {
            String barrioNombre = extraerBarrio(piso.getDireccion());
            Barrio barrio = resolveBarrio(barrioNombre, barrioCache);

            Propiedad propiedad = new Propiedad();
            propiedad.setTitulo(safe(piso.getTitulo()));
            propiedad.setPrecio(safe(piso.getPrecio()));
            propiedad.setDetalles(safe(piso.getDetalles()));
            propiedad.setDescripcionCorta(safe(piso.getDescripcionCorta()));
            propiedad.setUrl(safe(piso.getUrl()));
            propiedad.setBarrio(barrio);

            propiedadRepository.save(propiedad);
        }
    }

    private List<PisoJson> loadPisos() {
        ObjectMapper objectMapper = new ObjectMapper();
        Path path = Paths.get("almeria_pisos.json");
        try {
            if (Files.exists(path)) {
                return objectMapper.readValue(path.toFile(), new TypeReference<List<PisoJson>>() {});
            }

            ClassPathResource resource = new ClassPathResource("almeria_pisos.json");
            if (resource.exists()) {
                try (InputStream input = resource.getInputStream()) {
                    return objectMapper.readValue(input, new TypeReference<List<PisoJson>>() {});
                }
            }
        } catch (IOException ex) {
            log.error("Error leyendo almeria_pisos.json", ex);
        }

        return Collections.emptyList();
    }

    private Barrio resolveBarrio(String nombre, Map<String, Barrio> cache) {
        String key = nombre.toLowerCase(Locale.ROOT);
        Barrio cached = cache.get(key);
        if (cached != null) {
            return cached;
        }

        Optional<Barrio> existing = barrioRepository.findByNombreIgnoreCase(nombre);
        Barrio barrio = existing.orElseGet(() -> barrioRepository.save(new Barrio(nombre)));
        cache.put(key, barrio);
        return barrio;
    }

    private String extraerBarrio(String direccion) {
        if (direccion == null) {
            return "Desconocido";
        }

        String cleaned = direccion.trim();
        if (cleaned.isEmpty()) {
            return "Desconocido";
        }

        String[] parts = cleaned.split(",");
        String barrio = parts[0].trim();
        barrio = barrio.replaceAll("\\s+", " ");
        return barrio.isEmpty() ? "Desconocido" : barrio;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
