import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        # go to page
        await page.goto('https://www.fotocasa.es/es/comprar/viviendas/espana/todas-las-zonas/l?text=Almeria')
        
        # simple wait
        await page.wait_for_timeout(5000)
        
        html = await page.content()
        with open('c:/Users/anton/Desktop/RepoScraping2/test_html.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        await browser.close()

asyncio.run(main())
