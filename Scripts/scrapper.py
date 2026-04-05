import scrapy
import json
import re
from scrapy.crawler import CrawlerProcess
from scrapy_playwright.page import PageMethod  

class FotocasaSpider(scrapy.Spider):
    name = 'fotocasa'
    
    start_urls = ['https://www.fotocasa.es/es/comprar/viviendas/espana/todas-las-zonas/l?text=Almeria']

    custom_settings = {
        'FEEDS': {
            'almeria_pisos.json': {
                'format': 'json',
                'encoding': 'utf8',
                'indent': 4,
                'overwrite': True,
            },
        },
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'DOWNLOAD_HANDLERS': {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        'TWISTED_REACTOR': "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        'PLAYWRIGHT_BROWSER_TYPE': 'chromium',
        'PLAYWRIGHT_LAUNCH_OPTIONS': {
            'headless': False,
        },
        'PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT': 120000, 
    }

    @staticmethod
    def extract_address_from_text(value):
        if not value:
            return None
        cleaned = " ".join(value.split())
        cleaned = re.sub(r'^(foto|imagen)\s*\d*\s*de\s*', '', cleaned, flags=re.IGNORECASE).strip()
        if not cleaned:
            return None
        lowered = cleaned.lower()
        for marker in (" en venta en ", " en alquiler en "):
            idx = lowered.rfind(marker)
            if idx != -1:
                return cleaned[idx + len(marker):].strip()
        idx = lowered.rfind(" en ")
        if idx != -1:
            return cleaned[idx + 4:].strip()
        return cleaned

    @staticmethod
    def is_missing_address(value):
        if not value:
            return True
        return value.strip().lower().startswith("sin direc")

    def start_requests(self):
        script_extraccion = """
        async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            const normalizeText = value => (value || '').replace(/\\s+/g, ' ').trim();
            const stripPhotoPrefix = value => {
                const cleaned = normalizeText(value);
                return cleaned.replace(/^(foto|imagen)\\s*\\d*\\s*de\\s*/i, '').trim();
            };
            const extractAddressFromText = value => {
                const clean = stripPhotoPrefix(value);
                if (!clean) return null;
                const lower = clean.toLowerCase();
                const markers = [' en venta en ', ' en alquiler en '];
                for (const marker of markers) {
                    const idx = lower.lastIndexOf(marker);
                    if (idx >= 0) {
                        return clean.slice(idx + marker.length).trim();
                    }
                }
                const idx = lower.lastIndexOf(' en ');
                if (idx >= 0) {
                    return clean.slice(idx + 4).trim();
                }
                return clean;
            };
            const buildLocationMap = () => {
                const map = new Map();
                const root = window.__INITIAL_PROPS__ || null;
                if (!root) return map;
                const seen = new Set();
                const stack = [root];
                while (stack.length) {
                    const node = stack.pop();
                    if (!node || typeof node !== 'object') continue;
                    if (seen.has(node)) continue;
                    seen.add(node);

                    if (node.detailUrl && node.location) {
                        try {
                            const abs = new URL(node.detailUrl, window.location.origin).href;
                            map.set(abs, node.location);
                        } catch (e) {}
                    }

                    for (const val of Object.values(node)) {
                        if (val && typeof val === 'object') stack.push(val);
                    }
                }
                return map;
            };
            
            const botones = document.querySelectorAll('button');
            botones.forEach(btn => {
                const txt = (btn.innerText || '').toLowerCase();
                if(txt.includes('aceptar') || txt.includes('rechazar')) {
                    btn.click();
                }
            });
            await delay(1500);

            const pisosExtraidos = new Map();
            const locationMap = buildLocationMap();

            for (let i = 0; i < 25; i++) {
                window.scrollBy(0, 500);
                await delay(700); 
                
                const anuncios = document.querySelectorAll('div[data-panot-component="link-box"]');
                anuncios.forEach(anuncio => {
                    const linkEl = anuncio.querySelector('h3 a');
                    if (!linkEl) return;
                    const url = linkEl.href;
                    
                    const titleEl = anuncio.querySelector('h3 a');
                    const imageEl = anuncio.querySelector('picture img, img');
                    const priceEl = anuncio.querySelector('[class*="text-display-3"]');
                    const featuresEls = anuncio.querySelectorAll('ul[class*="text-body-1"] li');
                    const descEl = anuncio.querySelector('p[class*="text-body-2"]');
                    const locationEl = anuncio.querySelector('p.text-body-1.text-on-surface.opacity-75.truncate');
                    const locationText = locationEl ? normalizeText(locationEl.innerText) : null;

                        if (!pisosExtraidos.has(url)) {
                        let direccion = null;
                        const loc = locationMap.get(url);
                        if (loc) {
                            const address = loc.address && loc.address !== 'N/A -1' ? loc.address.trim() : null;
                            const zone = loc.zone ? loc.zone.trim() : null;
                            const locality = loc.locality ? loc.locality.trim() : null;
                            if (address) {
                                direccion = (zone && !address.includes(zone)) ? `${address}, ${zone}` : address;
                            } else {
                                direccion = zone || locality || null;
                            }
                        }

                        if (locationText) {
                            direccion = locationText;
                        }

                        if (!direccion && imageEl) {
                            const imageText = imageEl.getAttribute('alt') || imageEl.getAttribute('title') || imageEl.getAttribute('aria-label');
                            direccion = extractAddressFromText(imageText);
                        }

                        if (!direccion && linkEl) {
                            const linkText = linkEl.getAttribute('title') || linkEl.getAttribute('aria-label');
                            direccion = extractAddressFromText(linkText);
                        }

                        if (!direccion && titleEl) {
                            direccion = extractAddressFromText(titleEl.innerText);
                        }

                        pisosExtraidos.set(url, {
                            titulo: titleEl ? titleEl.innerText.trim() : 'Sin título',
                            precio: priceEl ? priceEl.innerText.replace(/\\n/g, ' ').trim() : 'Consultar',
                            detalles: Array.from(featuresEls).map(el => el.innerText.trim()).filter(t => t && t !== '·').join(' | '),
                            descripcion_corta: descEl ? descEl.innerText.trim() : 'Sin descripción',
                            url: url,
                            direccion: direccion || null
                        });
                    }
                });
            }
            
            const contenedorDatos = document.createElement('script');
            contenedorDatos.id = 'datos-extraidos';
            contenedorDatos.type = 'application/json';
            contenedorDatos.text = JSON.stringify(Array.from(pisosExtraidos.values()));
            document.body.appendChild(contenedorDatos);
        }
        """
        for url in self.start_urls:
            yield scrapy.Request(
                url,
                meta={
                    "playwright": True,
                    "playwright_page_methods": [
                        PageMethod("evaluate", script_extraccion),
                        PageMethod("wait_for_timeout", 2000), 
                    ],
                }
            )

    def parse(self, response):
        datos_json = response.css('#datos-extraidos::text').get()
        
        anuncios = []

        if datos_json:
            anuncios = json.loads(datos_json)
            self.logger.info(f" Extraídos {len(anuncios)} anuncios de la memoria de Playwright.")
        else:
            self.logger.warning(" No se encontraron datos en memoria. Intentando parseo directo del HTML.")
            vistos = set()
            for anuncio in response.css('div[data-panot-component="link-box"]'):
                link = anuncio.css('h3 a::attr(href)').get()
                if not link:
                    continue
                url = response.urljoin(link)
                if url in vistos:
                    continue
                vistos.add(url)

                title = anuncio.css('h3 a::text').get()
                price = anuncio.css('[class*="text-display-3"]::text').get()
                features = anuncio.css('ul[class*="text-body-1"] li::text').getall()
                desc = anuncio.css('p[class*="text-body-2"]::text').get()
                image_text = anuncio.css('picture img::attr(alt), img::attr(alt), picture img::attr(title), img::attr(title), picture img::attr(aria-label), img::attr(aria-label)').get()
                location_text = anuncio.css('p.text-body-1.text-on-surface.opacity-75.truncate::text').get()
                direccion = self.extract_address_from_text(location_text) or self.extract_address_from_text(image_text)

                anuncios.append({
                    "titulo": title.strip() if title else "Sin título",
                    "precio": price.replace("\n", " ").strip() if price else "Consultar",
                    "detalles": " | ".join([t.strip() for t in features if t and t.strip() != "·"]),
                    "descripcion_corta": desc.strip() if desc else "Sin descripción",
                    "url": url,
                    "direccion": direccion,
                })

        if not anuncios:
            self.logger.error(" No se pudieron extraer anuncios del listado.")
            return

        for anuncio in anuncios:
            direccion = anuncio.get("direccion")
            if self.is_missing_address(direccion):
                titulo = anuncio.get("titulo") or ""
                direccion = self.extract_address_from_text(titulo) or direccion
            anuncio["direccion"] = direccion or "Sin direccion"
            yield anuncio

if __name__ == "__main__":
    process = CrawlerProcess()
    process.crawl(FotocasaSpider)
    process.start()




