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
    const layoutTemplate = Handlebars.compile(layoutContent); // Compile main.hbs layout

    for (const file of pageFiles) {
        if (file.endsWith('.hbs')) {
            const pageName = path.basename(file, '.hbs');
            const pageFilePath = path.join(config.pagesDir, file);
            const pageSpecificContent = await fs.readFile(pageFilePath, 'utf-8'); // Content of index.hbs, etc.

            // Data object for this specific page
            // It will be populated by {{set}} helpers when pageSpecificTemplate is executed
            const pageData = {
                site: config.site, // Global site config
                companyProfile: config.companyProfile, // Global company profile
                // pageTitle, metaDescription, etc., will be added by {{set}} helpers
            };

            // Compile the page-specific content (e.g., index.hbs)
            // This step is primarily to execute {{set}} helpers and gather metadata.
            // The actual HTML fragment for the body is also produced here.
            const pageSpecificTemplate = Handlebars.compile(pageSpecificContent);
            const bodyHtml = pageSpecificTemplate(pageData); // This executes {{set}} and returns HTML for body

            // The pageData object is modified by reference by the 'set' helpers if they are in pageSpecificContent.
            // All variables set by {{set}} are now available in pageData.
            // Now, pass this data, including the bodyHtml, to the main layout template.
            const finalHtml = layoutTemplate({
                ...pageData, // Contains site, companyProfile, and anything from {{set}}
                body: bodyHtml, // The compiled HTML of the page itself
            });

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
