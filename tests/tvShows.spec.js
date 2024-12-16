import { browser, $, expect } from '@wdio/globals';
import path from 'path';
import fs from 'fs';

describe('TvShows', () => {

    const tvShowPath = './tests/tmp/South Park/';
    const tvShowEpisodesPaths = [
        './tests/tmp/South Park/Temporada1/South Park 1x03.mkv',
        './tests/tmp/South Park/Temporada2/South Park 2x10.mkv',
        './tests/tmp/South Park/South Park 4x05.mkv',
        './tests/tmp/South Park/South Park 4x05.srt',
    ]

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

    it('drag & drop tvshows', async () => {

        const tvShowTab = $('/html/body/div[2]/ul/li[2]');
        tvShowTab.click();
        await browser.pause(5000);
        const tvShowList = $('#tvShowList');
        await tvShowList.waitForDisplayed({ timeout: 5000 });
        const isModalVisible = await tvShowList.isDisplayed();
        expect(isModalVisible).toBe(true);

        //create episodes
        for (const filePath of tvShowEpisodesPaths) {
            const file = path.resolve(filePath);
            if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });    
            if (!fs.existsSync(file))fs.writeFileSync(file, '');
        };

        await browser.execute((tvShowPath) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([''], tvShowPath.replace(/\/$/, '').split('/').pop()));
            const dropEvent = new Event('drop', { bubbles: true });
            Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
            document.getElementById('tvShowDropArea').dispatchEvent(dropEvent);
        }, tvShowPath);

        await browser.pause(5000);

        //check tvShowList
        const table = await $('#tvShowList');   
        const rows = await table.$$('tr');
        const firstRowCells = await rows[0].$$('td');
        const firstCellText = await firstRowCells[0].getText();
        const secondCellText = await firstRowCells[1].getText();
        expect(firstCellText).toBe('South Park');
        expect(secondCellText).toBe('');

    });

    it('find button', async () => {

        const findButton1 = await $('//*[@id="tvShowList"]/tr/td[3]/button');
        findButton1.click();
        const movieModal = await $('#movieModal');
        await movieModal.waitForDisplayed({ timeout: 5000 });
        let isModalVisible = await movieModal.isDisplayed();
        expect(isModalVisible).toBe(true);

        const titleInput = await $('#title');
        expect(await titleInput.getValue()).toBe('South Park');
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
        expect(childDivs.length).toBe(4);

        const image = await $('//*[@id="findResults"]/div/div[1]/figure/img');
        const src = await image.getAttribute('src');
        expect(src).not.toBe('');
        expect(src).toMatch(/^https?:\/\/.+/);

        const link = await $('//*[@id="findResults"]/div/div[2]/div/h2/a');
        expect(await link.isDisplayed()).toBe(true);
        const href = await link.getAttribute('href');
        const className = await link.getAttribute('class');
        const dataTitle = await link.getAttribute('data-title');
        const dataYear = await link.getAttribute('data-year');
        const dataId = await link.getAttribute('data-id');
        const linkText = await link.getText();
        expect(href).toBe('#');
        expect(className).toBe('movie-link');
        expect(dataTitle).toBe('South Park');
        expect(dataYear).toBe('1997');
        expect(dataId).toBe('2190');
        expect(linkText).toBe('South Park - 1997');

        const paragraph = await $('//*[@id="findResults"]/div/div[2]/div/p');
        const text = await paragraph.getText();
        expect(text.startsWith('South Park es una serie de televisión estadounidense de animación')).toBe(true);

        link.click();
        await browser.pause(5000);

        //modal is not opened

        isModalVisible = await movieModal.isDisplayed();
        expect(isModalVisible).toBe(false);

        //check tvShowList
        const table = await $('#tvShowList');   
        let rows = await table.$$('tr');
        let firstRowCells = await rows[0].$$('td');
        let firstCellText = await firstRowCells[0].getText();
        let secondCellText = await firstRowCells[1].getText();
        expect(firstCellText).toBe('South Park');
        expect(secondCellText).toBe('South Park (1997)');

        //check episodes
        const episodesTable = await $('#episodesList');  
        rows = await episodesTable.$$('tr');
        firstRowCells = await rows[0].$$('td');
        firstCellText = await firstRowCells[0].getText();
        expect(firstCellText).toBe('South Park 2x10.mkv');
        firstRowCells = await rows[1].$$('td');
        firstCellText = await firstRowCells[0].getText();
        expect(firstCellText).toBe('South Park 1x03.mkv');
        firstRowCells = await rows[2].$$('td');
        firstCellText = await firstRowCells[0].getText();
        expect(firstCellText).toBe('South Park 4x05.mkv');
        let input = await $('//*[@id="episodesList"]/tr[1]/td[2]/input');
        expect(await input.getValue()).toBe("2");
        input = await $('//*[@id="episodesList"]/tr[1]/td[3]/input');
        expect(await input.getValue()).toBe("10");
        input = await $('//*[@id="episodesList"]/tr[2]/td[2]/input');
        expect(await input.getValue()).toBe("1");
        input = await $('//*[@id="episodesList"]/tr[2]/td[3]/input');
        expect(await input.getValue()).toBe("3");
        input = await $('//*[@id="episodesList"]/tr[3]/td[2]/input');
        expect(await input.getValue()).toBe("4");
        input = await $('//*[@id="episodesList"]/tr[3]/td[3]/input');
        expect(await input.getValue()).toBe("5");
    });

    it('remove', async () => {
        const removeButton = await $('//*[@id="episodesList"]/tr[2]/button');   
        removeButton.click();
        await browser.pause(5000);
        const table = await $('#episodesList');   
        const rows = await table.$$('tr');
        expect(rows.length).toBe(2);
    });

    it('rename button', async () => {

        //get paths in table:
        const table = await $('#episodesList');   
        const rows = await table.$$('tr');
        const dataPaths = [];
        for (const row of rows) {
            const input = await row.$('input[data-path]');
            if (input) {
                const dataPath = await input.getAttribute('data-path');
                if (dataPath) dataPaths.push(dataPath);
            }
        }
        const validPaths = [...new Set(dataPaths)];

        //rename button
        const removeButton = await $('#renameTvShowsButton');   
        removeButton.click();
        await browser.pause(5000);
        const checkDiv = await $('//*[@id="tvShowList"]/tr/td[3]/div');
        await expect(checkDiv).toBeExisting();
        const text = await checkDiv.getText();
        expect(text).toBe('✅');

        const tvShowOriginal = await (await $('//*[@id="tvShowList"]/tr/td[1]')).getText();
        const tvShowRenamed = await (await $('//*[@id="tvShowList"]/tr/td[2]')).getText();

        //check renamed files
        for (let originalPath of tvShowEpisodesPaths) {
            const fileName = path.basename(originalPath);
            const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
            const validFileNames = validPaths.map(validPath => path.basename(validPath, path.extname(validPath)));
            const isRenamed = validFileNames.includes(fileNameWithoutExt);
            const updatedFileName = isRenamed
                ? fileNameWithoutExt.replace(/(\d+)x(\d+)/, (_, season, episode) => {
                    return `S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
                }) + path.extname(fileName)
                : fileName;
            const expectedPath = path.resolve(originalPath.replace(fileName, updatedFileName));
            const expectedPathFull = expectedPath.replace(tvShowOriginal, tvShowRenamed);
            expect(fs.existsSync(expectedPathFull)).toBe(true);
        }
    });

});