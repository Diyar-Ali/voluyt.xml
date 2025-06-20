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
        defaultTitle: 'Voluyt - Samen vooruitgang realiseren',
        defaultDescription: 'Voluyt helpt organisaties hun volledige potentieel te ontsluiten door consultancy, interim management, continuous improvement en business intelligence.',
        defaultOgImage: '/assets/images/logo-primary.svg', // Will be used if page specific not set
        defaultKeywords: 'Voluyt, consultancy, interim management, continuous improvement, procesverbetering, performance management, business intelligence, Amsterdam',
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
            mission: 'Onze missie is om organisaties te helpen hun volledige potentieel te ontsluiten door complexe uitdagingen om te zetten in concrete, duurzame resultaten. Wij geloven in de kracht van samenwerking en praktische implementatie om meetbare vooruitgang te boeken.',
            vision: 'Onze visie is om de meest vertrouwde partner te zijn voor organisatorische transformatie in Nederland. We streven ernaar bekend te staan om onze diepgaande expertise, pragmatische aanpak en het vermogen om niet alleen strategieën te ontwikkelen, maar deze ook succesvol te implementeren en te verankeren in de cultuur van onze klanten.',
            marketPositioning: "We willen bekend staan als de consultants die 'het zelf ook gedaan hebben'. Onze kracht ligt in de combinatie van strategisch inzicht en operationele ervaring, wat ons onderscheidt van traditionele adviesbureaus. Wij zijn de brug tussen de directiekamer en de werkvloer.", // From XML
            usp: "Onze 'Unique Selling Proposition' is de synergie tussen onze diensten: we bieden niet alleen advies (Consultancy), maar verbeteren ook processen (Continuous Improvement), vullen cruciale rollen in (Interim Management), ontsluiten data (Business Intelligence) en ontwikkelen mensen (Learning & Development) voor een holistische en duurzame transformatie." // From XML
        },
        services: [
            { id: 'consultancy', title: 'Consultancy', slug: 'consultancy', shortDescription: 'Strategisch advies en operationele expertise.', fullDescription: 'Uitgebreide beschrijving van Consultancy diensten...', keywords: 'consultancy, organisatieadvies, strategie' },
            { id: 'interim', title: 'Interim Management', slug: 'interim-management', shortDescription: 'Tijdelijke invulling van cruciale managementposities.', fullDescription: 'Uitgebreide beschrijving van Interim Management...', keywords: 'interim management, tijdelijk management, leiderschap' },
            { id: 'continuous-improvement', title: 'Continuous Improvement', slug: 'continuous-improvement', shortDescription: 'Processen optimaliseren en een cultuur van zelfverbeteren.', fullDescription: 'Uitgebreide beschrijving van Continuous Improvement...', keywords: 'procesverbetering, lean, six sigma, operationele excellentie' },
            { id: 'bi', title: 'Business Intelligence', slug: 'business-intelligence', shortDescription: 'Data omzetten in waardevolle inzichten.', fullDescription: 'Uitgebreide beschrijving van Business Intelligence...', keywords: 'business intelligence, data-analyse, dashboards, rapportages' },
            { id: 'learning', title: 'Learning & Development', slug: 'learning-development', shortDescription: 'Ontwikkelen van vaardigheden en kennis.', fullDescription: 'Uitgebreide beschrijving van Learning & Development...', keywords: 'training, development, workshops, personeelsontwikkeling' },
            { id: 'performance', title: 'Performance Management', slug: 'performance-management', shortDescription: 'Prestaties meten en verbeteren.', fullDescription: 'Uitgebreide beschrijving van Performance Management...', keywords: 'performance management, kpi, prestatie-indicatoren' }
        ],
        themes: [
           { id: 'procesverbetering', title: 'Procesverbetering', slug: 'procesverbetering', shortDescription: 'Optimaliseer uw bedrijfsprocessen voor efficientie.', fullDescription: 'Diepgaande informatie over hoe Voluyt procesverbetering aanpakt...', keywords: 'procesoptimalisatie, lean, workflow, efficiëntie' },
           { id: 'datagedreven', title: 'Datagedreven Besluitvorming', slug: 'datagedreven-besluitvorming', shortDescription: 'Gebruik data om betere strategische beslissingen te nemen.', fullDescription: 'Ontdek hoe Voluyt u helpt datagedreven te werken...', keywords: 'data analyse, business intelligence, besluitvorming, data' },
           { id: 'leiderschap', title: 'Leiderschapsontwikkeling', slug: 'leiderschapsontwikkeling', shortDescription: 'Versterk het leiderschap binnen uw organisatie.', fullDescription: "Programma's en coaching voor effectief leiderschap door Voluyt...", keywords: 'leiderschap, management, coaching, teamontwikkeling' }
        ],
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
            const pageName = path.basename(file, '.hbs'); // e.g., "index", "consultancy"
            const pageFilePath = path.join(config.pagesDir, file);
            const pageSpecificContent = await fs.readFile(pageFilePath, 'utf-8');

            // Initialize pageData with global and default values
            const pageData = {
                site: config.site,
                companyProfile: config.companyProfile,
                pageName: pageName, // Pass pageName for potential use in templates, like finding active nav link
                pageTitle: config.site.defaultTitle,
                metaDescription: config.site.defaultDescription,
                ogImage: config.site.baseUrl + config.site.defaultOgImage,
                ogUrl: `${config.site.baseUrl}/${pageName === 'index' ? '' : pageName + '.html'}`,
                keywords: config.site.defaultKeywords,
            };

            // Check if this pageName matches a service slug
            const serviceData = config.companyProfile.services.find(s => s.slug === pageName);
            if (serviceData) {
                pageData.service = serviceData; // Inject as 'service'
                // Optionally override default SEO meta with service specific data if not using {{set}} in template
                // For example:
                // pageData.pageTitle = `${serviceData.title} - Voluyt`;
                // pageData.metaDescription = serviceData.shortDescription; // Or a more detailed one
                // pageData.keywords = serviceData.keywords;
                // However, the current service templates use {{set}} for these, which is fine.
            }

            // Check if this pageName matches a theme slug (e.g., pageName "theme-procesverbetering" should match slug "procesverbetering")
            // This requires theme slugs in config.companyProfile.themes to NOT have "theme-" prefix.
            // Or, we strip "theme-" from pageName before matching.
            let themeSlugToFind = pageName;
            if (pageName.startsWith('theme-')) {
                themeSlugToFind = pageName.substring(6); // Remove "theme-" prefix
            }
            const themeData = config.companyProfile.themes.find(t => t.slug === themeSlugToFind);
            if (themeData) {
                pageData.theme = themeData; // Inject as 'theme'
                 // Similar SEO overrides can be done here if not handled by {{set}} in theme templates
            }

            const pageSpecificTemplate = Handlebars.compile(pageSpecificContent);
            const bodyHtml = pageSpecificTemplate(pageData); // {{set}} helpers modify pageData

            if (pageData.ogImage && !pageData.ogImage.startsWith('http')) {
                pageData.ogImage = config.site.baseUrl + (pageData.ogImage.startsWith('/') ? '' : '/') + pageData.ogImage;
            }
            // ogUrl is already full

            const finalHtml = layoutTemplate({
                ...pageData,
                body: bodyHtml,
            });

            const outputFilePath = path.join(config.buildDir, `${pageName}.html`);
            await fs.writeFile(outputFilePath, finalHtml);
            console.log(`  Compiled: ${file} -> ${pageName}.html (Title: ${pageData.pageTitle})`);
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
