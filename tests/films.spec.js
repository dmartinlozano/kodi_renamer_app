import { browser, $, expect } from '@wdio/globals';
import path from 'path';
import fs from 'fs';

describe('Films', () => {

    const filePaths = [
        './tests/tmp/Aterriza como puedas.mp4',
        './tests/tmp/Aterriza como puedas 1.mp4',
        './tests/tmp/Aterriza como puedas 1.srt'
    ];

    it('electron open', async () => {
        const window = await browser.getWindowHandles();
        expect(window.length).toBeGreaterThan(0);
    });
  
    it('settings', async () => {

        await browser.pause(5000);

        //settings modal
        const settingsModal = $('#settingsModal');
        await settingsModal.waitForDisplayed({ timeout: 5000 });
        const isModalVisible = await settingsModal.isDisplayed();
        expect(isModalVisible).toBe(true);

        //select spanish language in selector & adults content
        const languageSelector = $('#languageSelector');
        await languageSelector.click();
        await languageSelector.selectByAttribute('value', 'es');
        const selectedOption = await languageSelector.getValue();
        expect(selectedOption).toBe('es');

        //select adult checkbox
        const includeAdultCheckbox = $('#includeAdult');
        await includeAdultCheckbox.click();
        const isChecked = await includeAdultCheckbox.isSelected();
        expect(isChecked).toBe(true);

        //save button settings modal
        const saveSettingsButton = $('#saveSettingsButton');
        await saveSettingsButton.click();
        await settingsModal.waitForDisplayed({ reverse: true, timeout: 5000 });
    });

    it('drag & drop films', async () => {

        for (const filePath of filePaths) {
            const file = path.resolve(filePath);
            if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });    
            if (!fs.existsSync(file))fs.writeFileSync(file, '');
        };

        await browser.execute((filePaths) => {
            const dataTransfer = new DataTransfer();
            for (const filePath of filePaths) {
                dataTransfer.items.add(new File([''], filePath.split('/').pop()));
            }
            const dropEvent = new Event('drop', { bubbles: true });
            Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
            document.getElementById('filmsDropArea').dispatchEvent(dropEvent);
        }, filePaths);

        await browser.pause(5000);

        //check filmsList
        const table = await $('#filmsList');   
        const rows = await table.$$('tr');
        const firstRowCells = await rows[0].$$('td');
        const firstCellText = await firstRowCells[0].getText();
        const secondCellText = await firstRowCells[1].getText();
        expect(firstCellText).toBe('Aterriza como puedas.mp4');
        expect(secondCellText).toBe('');
        const secondRowCells = await rows[1].$$('td');
        const secondRowFirstCellText = await secondRowCells[0].getText();
        const secondRowSecondCellText = await secondRowCells[1].getText();
        expect(secondRowFirstCellText).toBe('Aterriza como puedas 1.mp4');
        expect(secondRowSecondCellText).toBe('Aterriza como puedas (1980) {tmdb-813}.mp4');

    });

    it('find button', async () => {

        const findButton1 = await $('//*[@id="filmsList"]/tr[1]/td[3]/button[1]');
        findButton1.click();
        const movieModal = await $('#movieModal');
        await movieModal.waitForDisplayed({ timeout: 5000 });
        let isModalVisible = await movieModal.isDisplayed();
        expect(isModalVisible).toBe(true);

        const titleInput = await $('#title');
        expect(await titleInput.getValue()).toBe('Aterriza como puedas');
        const yearInput = await $('#year');
        expect(await yearInput.getValue()).toBe('');
        const mediaModalLangInput = await $('#mediaModalLangInput');
        expect(await mediaModalLangInput.getValue()).toBe('ES');

        const findButton2 = await $('//*[@id="searchForm"]/div/div[4]/button');
        findButton2.click();

        //results appears

        await browser.pause(5000);

        const findResults = await $('#findResults');
        const childDivs = await findResults.$$('div');
        expect(childDivs.length).toBe(8);

        const image = await $('//*[@id="findResults"]/div[1]/div[1]/figure/img');
        const src = await image.getAttribute('src');
        expect(src).not.toBe('');
        expect(src).toMatch(/^https?:\/\/.+/);

        const link = await $('//*[@id="findResults"]/div[1]/div[2]/div/h2/a');
        expect(await link.isDisplayed()).toBe(true);
        const href = await link.getAttribute('href');
        const className = await link.getAttribute('class');
        const dataTitle = await link.getAttribute('data-title');
        const dataYear = await link.getAttribute('data-year');
        const dataId = await link.getAttribute('data-id');
        const linkText = await link.getText();
        expect(href).toBe('#');
        expect(className).toBe('movie-link');
        expect(dataTitle).toBe('Aterriza como puedas');
        expect(dataYear).toBe('1980');
        expect(dataId).toBe('813');
        expect(linkText).toBe('Aterriza como puedas - 1980');

        const paragraph = await $('//*[@id="findResults"]/div[1]/div[2]/div/p');
        const text = await paragraph.getText();
        expect(text.startsWith('El vuelo 209 de la Trans American')).toBe(true);

        link.click();
        await browser.pause(5000);

        //modal is not opened

        isModalVisible = await movieModal.isDisplayed();
        expect(isModalVisible).toBe(false);


        //check filmsList
        const table = await $('#filmsList');   
        const rows = await table.$$('tr');
        const firstRowCells = await rows[0].$$('td');
        const firstCellText = await firstRowCells[0].getText();
        const secondCellText = await firstRowCells[1].getText();
        expect(firstCellText).toBe('Aterriza como puedas.mp4');
        expect(secondCellText).toBe('Aterriza como puedas (1980) {tmdb-813}.mp4');
    });

    it('remove', async () => {
        const removeButton = await $('//*[@id="filmsList"]/tr[1]/td[3]/button[2]');   
        removeButton.click();
        await browser.pause(5000);
        const table = await $('#filmsList');   
        const rows = await table.$$('tr');
        expect(rows.length).toBe(1);
    });

    it('rename button', async () => {
        const removeButton = await $('#renameFilmsButton');   
        removeButton.click();
        await browser.pause(5000);
        const checkDiv = await $('//*[@id="filmsList"]/tr/td[3]/div');
        await expect(checkDiv).toBeExisting();
        const text = await checkDiv.getText();
        expect(text).toBe('✅');

        let filePath = path.resolve('./tests/tmp/Aterriza como puedas (1980) {tmdb-813}.mp4');
        expect(true).toBe(fs.existsSync(filePath));

        filePath = path.resolve('./tests/tmp/Aterriza como puedas (1980) {tmdb-813}.srt');
        expect(true).toBe(fs.existsSync(filePath));
    });
});
  