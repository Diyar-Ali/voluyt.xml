const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// Configuration
const config = {
    srcDir: path.join(__dirname, 'src'),
    buildDir: path.join(__dirname, 'build'),
    templatesDir: path.join(__dirname, 'src', 'templates'),
    pagesDir: path.join(__dirname, 'src', 'templates', 'pages'),
    partialsDir: path.join(__dirname, 'src', 'templates', 'partials'),
    layoutsDir: path.join(__dirname, 'src', 'templates', 'layouts'),
    assetsDir: path.join(__dirname, 'src', 'assets'),
    jsDir: path.join(__dirname, 'src', 'js'),
    site: {
        baseUrl: 'https://www.voluyt.com', // Replace with actual domain later
        // Add other global site data if needed
    },
    // Placeholder for companyProfile data (to be loaded from XML in a real scenario)
    companyProfile: {
        companyInfo: {
            name: 'Voluyt',
            tagline: 'Samen vooruitgang realiseren.',
            legalDetails: {
                registeredName: 'Voluyt B.V.',
                kvkNumber: '60215666', // From XML
                btwNumber: 'NL853813103B01' // From XML
            },
            location: {
                address: 'Matrix Innovation Center, Science Park 400', // From XML
                postalCode: '1018 XH', // From XML
                city: 'Amsterdam', // From XML
                country: 'The Netherlands' // From XML
            },
            contact: {
                email: 'info@voluyt.com', // From XML
                phone: '+31 20 123 4567', // From XML
                linkedin: 'https://www.linkedin.com/company/voluyt/', // From XML
                bookingsUrl: 'https://outlook.office365.com/owa/calendar/Voluyt@voluyt.com/bookings/' // From XML
            }
        },
        strategyAndBranding: {
            mission: 'Onze missie is om organisaties te helpen hun volledige potentieel te ontsluiten door complexe uitdagingen om te zetten in concrete, duurzame resultaten. Wij geloven in de kracht van samenwerking en praktische implementatie om meetbare vooruitgang te boeken.', // From XML
            vision: 'Onze visie is om de meest vertrouwde partner te zijn voor organisatorische transformatie in Nederland. We streven ernaar bekend te staan om onze diepgaande expertise, pragmatische aanpak en het vermogen om niet alleen strategieën te ontwikkelen, maar deze ook succesvol te implementeren en te verankeren in de cultuur van onze klanten.', // From XML
        },
        team: {
            keyFigure: [ // From XML
                { id: 'PL01', name: 'Pascal Luyten', role: 'Consultancy & Interim management', bio: 'Pascal is een ervaren consultant en interim manager met een passie voor het realiseren van strategische doelen...', photoUrl: '/assets/images/team/pascal-luyten.jpg' },
                { id: 'MH01', name: 'Menno Henstra', role: 'Zelfverbeteren, Continuous improvement', bio: 'Menno is de expert op het gebied van continuous improvement en Lean...', photoUrl: '/assets/images/team/menno-henstra.jpg' },
                { id: 'CM01', name: 'Colin Mols', role: 'Business Intelligence, Learning & Development', bio: 'Colin is gespecialiseerd in het vertalen van data naar bruikbare inzichten...', photoUrl: '/assets/images/team/colin-mols.jpg' }
            ]
        }
        // Add other companyProfile sections as needed
    },
    // Placeholder for stylingProfile data
    stylingProfile: {
        // ... content from stylingProfile.xml (e.g., colors, fonts) can be added here if needed by templates directly
    }
};

// --- Handlebars Helpers ---

// Helper to set a value in the context (used for pageTitle, metaDescription)
Handlebars.registerHelper('set', function(varName, varValue, options) {
    options.data.root[varName] = varValue;
});

// Helper for string concatenation
Handlebars.registerHelper('concat', function(...args) {
    args.pop(); // Remove Handlebars options object
    return args.join('');
});

// Helper for getting current year
Handlebars.registerHelper('currentYear', function() {
    return new Date().getFullYear();
});

// --- Build Functions ---

async function cleanBuildDir() {
    console.log('Cleaning build directory...');
    await fs.emptyDir(config.buildDir);
}

async function registerPartials() {
    console.log('Registering partials...');
    const partialFiles = await fs.readdir(config.partialsDir);
    for (const file of partialFiles) {
        if (file.endsWith('.hbs')) {
            const partialName = path.basename(file, '.hbs');
            const partialContent = await fs.readFile(path.join(config.partialsDir, file), 'utf-8');
            Handlebars.registerPartial(partialName, partialContent);
            console.log(`  Registered partial: ${partialName}`);
        }
    }
}

async function compilePages() {
    console.log('Compiling pages...');
    const pageFiles = await fs.readdir(config.pagesDir);
    const layoutContent = await fs.readFile(path.join(config.layoutsDir, 'main.hbs'), 'utf-8');
    // No need to compile main layout separately if using it as a string template for each page

    for (const file of pageFiles) {
        if (file.endsWith('.hbs')) {
            const pageName = path.basename(file, '.hbs');
            const pageFilePath = path.join(config.pagesDir, file);
            const pageContent = await fs.readFile(pageFilePath, 'utf-8');

            // Each page can have its own context, inheriting global context
            const pageData = {
                ...config, // Global site config, companyProfile, etc.
                // page specific data can be added here if needed, though {{set}} helper handles some of this
            };

            // Compile the page template itself (which might define layout sections)
            const compiledPageTemplate = Handlebars.compile(pageContent);
            // Then compile the main layout, providing the compiled page content (and its layout sections)
            // This approach allows pages to define what goes into {{body}} and other layout blocks.
            // The `set` helper populates pageTitle, metaDescription in pageData.root
            const pageHtmlFragment = compiledPageTemplate(pageData);

            // The main.hbs layout expects {{{body}}}, pageTitle, metaDescription etc.
            // The `set` helper in page templates will have populated these in pageData.root
            // For `{{{body}}}`, Handlebars' #partial block mechanism handles this.
            // If using a simple `{{{body}}}`, ensure `pageHtmlFragment` is correctly structured.

            // The current setup uses `{{#partial "body"}}...{{/partial}}` and `{{> layouts/main}}` in each page.
            // So, we just compile the page file, and it will pull in the layout.
            const finalHtml = Handlebars.compile(pageContent)(pageData);


            const outputFilePath = path.join(config.buildDir, `${pageName}.html`);
            await fs.writeFile(outputFilePath, finalHtml);
            console.log(`  Compiled: ${file} -> ${pageName}.html`);
        }
    }
}

async function copyAssets() {
    console.log('Copying assets...');
    await fs.copy(config.assetsDir, path.join(config.buildDir, 'assets'));
    console.log('  Assets copied to build/assets');
}

async function copyJs() {
    console.log('Copying JS...');
    await fs.copy(config.jsDir, path.join(config.buildDir, 'js'));
    console.log('  JS copied to build/js');
}

// --- Main Build Script ---
async function build() {
    try {
        console.log('Starting Voluyt website build...');
        await cleanBuildDir();
        await registerPartials();
        // Data from XML would be loaded here and passed into compilePages
        await compilePages(); // Pass loaded data here
        await copyAssets();
        await copyJs();
        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
