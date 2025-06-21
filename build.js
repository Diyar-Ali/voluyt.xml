const fs = require('fs');
const path = require('path');
const vm = require('vm');

// This will be populated by fetching the Handlebars library code
let Handlebars;

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

const templatesDir = path.join(srcDir, 'templates');
const partialsDir = path.join(templatesDir, 'partials');
const layoutsDir = path.join(templatesDir, 'layouts');

// Helper function to emulate fs-extra's emptyDir
async function emptyDir(dir) {
    if (fs.existsSync(dir)) {
        for (const file of await fs.promises.readdir(dir)) {
            await fs.promises.rm(path.join(dir, file), { recursive: true, force: true });
        }
    } else {
        await fs.promises.mkdir(dir, { recursive: true });
    }
}

// Helper function to emulate fs-extra's copy
async function copy(src, dest) {
    const stat = await fs.promises.stat(src);
    if (stat.isDirectory()) {
        await fs.promises.mkdir(dest, { recursive: true });
        for (const file of await fs.promises.readdir(src)) {
            await copy(path.join(src, file), path.join(dest, file));
        }
    } else {
        await fs.promises.mkdir(path.dirname(dest), { recursive: true });
        await fs.promises.copyFile(src, dest);
    }
}

// Helper function to emulate fs-extra's ensureDir
async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
    }
}

// Helper function to emulate fs-extra's ensureFile and writeFile
async function ensureFileWithString(filePath, content) {
    await ensureDir(path.dirname(filePath));
    await fs.promises.writeFile(filePath, content);
}


async function build() {
    try {
        // 0. Clean the dist directory
        await emptyDir(distDir);
        console.log('Cleaned dist directory.');

        // 1. Register Handlebars Partials
        await ensureDir(partialsDir); // Ensure partialsDir exists before reading
        const partialFiles = await fs.promises.readdir(partialsDir);
        for (const file of partialFiles) {
            if (file.endsWith('.hbs')) {
                const partialName = path.basename(file, '.hbs');
                const partialContent = await fs.readFile(path.join(partialsDir, file), 'utf-8');
                Handlebars.registerPartial(partialName, partialContent);
                console.log(`Registered partial: ${partialName}`);
            }
        }

        // 2. Compile Main Templates (currently only index.hbs with main.hbs layout)
        //    For this project, index.hbs is the main content file, and main.hbs is the layout.

        //    First, read the main layout
        const mainLayoutContent = await fs.promises.readFile(path.join(layoutsDir, 'main.hbs'), 'utf-8');
        const layoutTemplate = Handlebars.compile(mainLayoutContent);

        //    Then, read the index page content
        const indexContentHbs = await fs.promises.readFile(path.join(templatesDir, 'index.hbs'), 'utf-8');
        const indexTemplate = Handlebars.compile(indexContentHbs);

        //    The body of index.hbs will be injected into the {{{body}}} of main.hbs
        //    We pass the output of indexTemplate() as context to layoutTemplate, specifically for the 'body'
        const pageContext = {
            // Add any global data needed by main.hbs here, e.g., page title
            title: 'Google Keep Clone',
            // The actual content of index.hbs is rendered and passed as 'body' to main.hbs
            body: indexTemplate({}) // Assuming index.hbs doesn't need specific data for now
        };

        const finalHtml = layoutTemplate(pageContext);
        await fs.promises.writeFile(path.join(distDir, 'index.php'), finalHtml); // Output as .php to allow PHP execution
        console.log('Compiled index.hbs with main.hbs layout to dist/index.php');

        // 3. Copy PHP API files
        const apiSrcDir = path.join(srcDir, 'api');
        const apiDistDir = path.join(distDir, 'api');
        await ensureDir(apiDistDir);
        await copy(apiSrcDir, apiDistDir);
        console.log('Copied API files to dist/api.');

        // 4. Copy JavaScript files
        const jsSrcDir = path.join(srcDir, 'js');
        const jsDistDir = path.join(distDir, 'js');
        await ensureDir(jsDistDir);
        await copy(jsSrcDir, jsDistDir);
        console.log('Copied JS files to dist/js.');

        // 5. Copy Assets (icons, favicon)
        const assetsSrcDir = path.join(srcDir, 'assets');
        const assetsDistDir = path.join(distDir, 'assets');
        await ensureDir(assetsDistDir);
        await copy(assetsSrcDir, assetsDistDir);
        console.log('Copied assets to dist/assets.');

        console.log('\nBuild process completed successfully!');

    } catch (error) {
        console.error('Error during build process:', error);
        process.exit(1);
    }
}

// Create dummy files for build script to run without errors initially
async function createDummyFiles() {
    await ensureDir(partialsDir);
    await ensureDir(layoutsDir);
    await ensureFileWithString(path.join(templatesDir, 'index.hbs'), '<h1>Hello from index.hbs</h1>');
    await ensureFileWithString(path.join(layoutsDir, 'main.hbs'), '<!DOCTYPE html><html><head><title>{{title}}</title></head><body>{{{body}}}</body></html>');
    await ensureDir(path.join(srcDir, 'api'));
    await ensureDir(path.join(srcDir, 'js'));
    await ensureDir(path.join(srcDir, 'assets', 'icons'));

    // Dummy app.js
    await ensureFileWithString(path.join(srcDir, 'js', 'app.js'), '// App.js placeholder');
    // Dummy config.php
    await ensureFileWithString(path.join(srcDir, 'api', 'config.php'), '<?php // Config.php placeholder ?>');
    // Dummy notes.php
    await ensureFileWithString(path.join(srcDir, 'api', 'notes.php'), '<?php // Notes.php placeholder ?>');
}

const tempHandlebarsPath = path.join(__dirname, 'temp_handlebars.js');

async function main() {
    let handlebarsLibCode;
    try {
        // Read Handlebars library code from the temporary file
        handlebarsLibCode = await fs.promises.readFile(tempHandlebarsPath, 'utf-8');
    } catch (error) {
        console.error(`Failed to read Handlebars library from ${tempHandlebarsPath}. Make sure it was created successfully.`, error);
        process.exit(1);
    }

    // Initialize Handlebars via VM
    const context = { module: {}, exports: {} };
    vm.createContext(context); // Create a context for the vm
    const script = new vm.Script(handlebarsLibCode);
    script.runInContext(context);
    Handlebars = context.module.exports; // Assign the exported Handlebars object

    if (!Handlebars || !Handlebars.compile) {
        console.error("Failed to load Handlebars library via VM after reading from temp file.");
        process.exit(1);
    }
    console.log("Handlebars loaded successfully via VM from temp file.");

    try {
        await createDummyFiles(); // Create placeholders so the build script can find all expected files
        await build();
    } finally {
        // Clean up the temporary Handlebars file
        try {
            await fs.promises.unlink(tempHandlebarsPath);
            console.log(`Deleted temporary file: ${tempHandlebarsPath}`);
        } catch (unlinkError) {
            console.warn(`Could not delete temporary Handlebars file: ${tempHandlebarsPath}`, unlinkError);
        }
    }
}

main().catch(err => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
});
