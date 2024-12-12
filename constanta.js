document.addEventListener('DOMContentLoaded', () => {
    try {
        const url = new URL(window.location.href);
        const subdomain = url.hostname.split('.')[0].toUpperCase();
        const domain = url.hostname.split('.').slice(1).join('.');
        const fullUrl = url.href;
        const path = url.pathname === "/" ? "Home" : url.pathname;
        const baseUrl = `${url.protocol}//${url.hostname}`;
        const supportEmail = `support@${domain}`;

        // Update dynamic content for main section
        const siteNameElement = document.querySelector('#siteName');
        if (siteNameElement) siteNameElement.textContent = `${subdomain}.${domain}`;
        
        const domainElement = document.querySelector('#domain');
        if (domainElement) domainElement.textContent = domain;
        
        const subdomainElement = document.querySelector('#subdomain');
        if (subdomainElement) subdomainElement.textContent = subdomain;
        
        const baseUrlElement = document.querySelector('#baseUrl');
        if (baseUrlElement) {
            baseUrlElement.textContent = baseUrl;
            baseUrlElement.href = baseUrl;
        }
        
        const fullUrlElement = document.querySelector('#fullUrl');
        if (fullUrlElement) fullUrlElement.textContent = fullUrl;
        
        const pathElement = document.querySelector('#path');
        if (pathElement) pathElement.textContent = path;
        
        const supportEmailElement = document.querySelector('#supportEmail');
        if (supportEmailElement) {
            supportEmailElement.textContent = supportEmail;
            supportEmailElement.href = `mailto:${supportEmail}`;
        }

        // Set meta description
        const descriptionMetaTag = document.querySelector('meta[name="description"]');
        if (descriptionMetaTag) {
            descriptionMetaTag.setAttribute('content', `Article ${subdomain}.${domain}.`);
        }

        // Update page title
        document.title = `Article | ${subdomain}`;
        
        const currentYearElement = document.querySelector('#current-year');
        if (currentYearElement) currentYearElement.textContent = new Date().getFullYear();
        
        const siteNameFooterElement = document.querySelector('#site-name');
        if (siteNameFooterElement) siteNameFooterElement.textContent = `${subdomain}.${domain}`;

        // Update dynamic content for footer section
        const siteNameFooter = document.querySelector('#siteNameFooter');
        if (siteNameFooter) siteNameFooter.textContent = `${subdomain}.${domain}`;
        
        const domainFooter = document.querySelector('#domainFooter');
        if (domainFooter) domainFooter.textContent = domain;
        
        const subdomainFooter = document.querySelector('#subdomainFooter');
        if (subdomainFooter) subdomainFooter.textContent = subdomain;
        
        const baseUrlFooter = document.querySelector('#baseUrlFooter');
        if (baseUrlFooter) {
            baseUrlFooter.textContent = baseUrl;
            baseUrlFooter.href = baseUrl;
        }
        
        const fullUrlFooter = document.querySelector('#fullUrlFooter');
        if (fullUrlFooter) fullUrlFooter.textContent = fullUrl;
        
        const pathFooter = document.querySelector('#pathFooter');
        if (pathFooter) pathFooter.textContent = path;
        
        const supportEmailFooter = document.querySelector('#supportEmailFooter');
        if (supportEmailFooter) {
            supportEmailFooter.textContent = supportEmail;
            supportEmailFooter.href = `mailto:${supportEmail}`;
        }

        const currentYearFooter = document.querySelector('#current-yearFooter');
        if (currentYearFooter) currentYearFooter.textContent = new Date().getFullYear();
        
        const siteNameFooterFinal = document.querySelector('#site-nameFooter');
        if (siteNameFooterFinal) siteNameFooterFinal.textContent = `${subdomain}.${domain}`;

    } catch (error) {
        console.error("Error updating dynamic content:", error);
    }
});
