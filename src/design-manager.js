var tabUrl = window.location.protocol + '//' + window.location.host + '/' + window.location.pathname;
var currentScreen = '';

// Function to set the title based on the current screen
function setTitle(siteName) {
	var portal = siteName.replace('www.', '');
	if (currentScreen === 'design-manager') {
		document.title = 'DM | ' + portal + ' | HS';
	} else if (currentScreen === 'content-staging') {
		document.title = 'CS | ' + portal + ' | HS';
	} else if (currentScreen === 'dashboard') {
		document.title = 'DB | ' + portal + ' | HS';
	} else if (currentScreen === 'website-pages') {
		document.title = 'WP | ' + portal + ' | HS';
	} else if (currentScreen === 'landing-pages') {
		document.title = 'LP | ' + portal + ' | HS';
	} else if (currentScreen === 'file-manager') {
		document.title = 'FM | ' + portal + ' | HS';
	} else if (currentScreen === 'hubdb') {
		document.title = 'DB | ' + portal + ' | HS';
	} else if (currentScreen === 'settings') {
		document.title = 'ST | ' + portal + ' | HS';
	} else if (currentScreen === 'navigation-settings') {
		document.title = 'NS | ' + portal + ' | HS';
	} else if (currentScreen === 'blog') {
		document.title = 'BL | ' + portal + ' | HS';
	} else if (currentScreen === 'url-redirects') {
		document.title = 'UR | ' + portal + ' | HS';
	}
}

// Function to wait for the element to be available in the DOM
function waitForEl(selector, callback) {
	const observer = new MutationObserver(() => {
		const element = document.querySelector(selector);
		if (element) {
			observer.disconnect();
			callback();
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

let appUrl = '';
if (/local\.hubspot/i.test(tabUrl)) {
	appUrl = /local\.hubspotqa/i.test(tabUrl) ? 'local.hubspotqa.com' : 'local.hubspot.com';
} else {
	appUrl = /app\.hubspotqa\.com/i.test(tabUrl) ? 'app.hubspotqa.com' : 'app.hubspot.com';
}

// Check if the URL is from HubSpot Backend
if (~tabUrl.indexOf(appUrl)) {
	if (/hubspot\.com/i.test(tabUrl)) {
		//console.log('This is the HubSpot backend.');

		const api = typeof browser !== 'undefined' ? browser : chrome;
		api.storage.local.get(['darkapp'], function (result) {
			const darkAppVaule = result.darkapp;
			console.log('darkapp:', darkAppVaule);
			if (darkAppVaule) {
				document.querySelector('body').classList.add('ext-dark-app');
			}
		});

		const hubspotPages = {
			'design-manager': /design-manager/i.test(tabUrl),
			'content-staging': /staging/i.test(tabUrl),
			dashboard: /reports-dashboard/i.test(tabUrl),
			'website-pages': /pages.*site/i.test(tabUrl),
			'landing-pages': /pages.*landing/i.test(tabUrl),
			'file-manager': /file-manager-beta/i.test(tabUrl),
			hubdb: /hubdb/i.test(tabUrl),
			settings: /settings(?!.*navigation)/i.test(tabUrl),
			'navigation-settings': /settings.*navigation/i.test(tabUrl),
			blog: /blog/i.test(tabUrl),
			'url-redirects': /url-redirects/i.test(tabUrl),
		};

		// Find the current active screen
		Object.entries(hubspotPages).forEach(([page, isMatched]) => {
			if (isMatched) {
				// console.log(`${page.charAt(0).toUpperCase() + page.slice(1)} is active`);
				currentScreen = page;
			}
		});

		// Wait for the account name element to be available
		waitForEl('.account-name', () => {
			setTitle(document.querySelector('.account-name').textContent);
		});

		// Add dark theme CSS if in Design Manager
		if (tabUrl.includes('/design-manager/')) {
			const api = typeof browser !== 'undefined' ? browser : chrome;
			api.storage.local.get(['darktheme'], function (result) {
				const darkthemeVaule = result.darktheme;
				console.log('darktheme:', darkthemeVaule);
				if (darkthemeVaule) {
					document.querySelector('body').classList.add('ext-dark-ide');
				}
			});

			//Show Sprocky
			sprocky();
		}
	} else if (/designers\.hubspot\.com\/docs/i.test(tabUrl)) {
		currentScreen = 'docs';
	}

	// Function to generate a menu item HTML
	function generateDevMenuItem(buttonLabel, hubId, url) {
		const link = url.replace('HUB_ID', hubId).replace('hub_id', hubId);
		return `
      <li role="none">
        <a role="menuitem" data-tracking="click hover" id="nav-secondary-design-tools-beta" class="navSecondaryLink" href="${link}">
          ${buttonLabel}
        </a>
      </li>`;
	}

	// Function to generate all menu items
	async function generateAllMenuItems(hubId) {
		let links = [];

		const getLinksFromStorage = new Promise((resolve) => {
			chrome.storage.sync.get('links', function (result) {
				if (result.links) {
					links = result.links;
				}
				resolve();
			});
		});

		await getLinksFromStorage;
		if (links.length === 0) {
			let devMenu;
			try {
				const response = await fetch(api.runtime.getURL('src/content.json'));
				const data = await response.json();
				devMenu = data.devMenu;
			} catch (error) {
				console.log('Error fetching or parsing JSON:', error);
			}

			if (devMenu) {
				links = devMenu.map((item) => ({
					label: item.label,
					url: item.url,
				}));
				chrome.storage.sync.set({ links: links });
			}
		}

		let menuItems = '';
		links.forEach((link) => {
			menuItems += generateDevMenuItem(link.label, hubId, link.url);
		});

		return menuItems;
	}

	// Generate the developer's menu
	async function generateDevMenu(hubId) {
		function sanitizeHTML(html) {
			const template = document.createElement('template');
			template.innerHTML = html;
			return template.content;
		}

		const html = `<li id="ext-dev-menu-wrapper" role="none" class="expandable">
						<a href="#" id="nav-primary-dev-branch" aria-haspopup="true" aria-expanded="false" class="primary-link" data-tracking="click hover" role-menu="menuitem">
						  Developer Extension <svg style="max-height:4px;max-width:10px;" class="nav-icon arrow-down-icon" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 13"><g><g><path d="M21.47,0.41L12,9.43l-9.47-9A1.5,1.5,0,1,0,.47,2.59l10.5,10,0,0a1.51,1.51,0,0,0,.44.28h0a1.43,1.43,0,0,0,1,0h0A1.52,1.52,0,0,0,13,12.61l0,0,10.5-10A1.5,1.5,0,1,0,21.47.41" transform="translate(0 0)"></path></g></g></svg>
						</a>
						<div id="ext-dev-menu" aria-label="Developer" role="menu" class="secondary-nav expansion" style="min-height: 0px">
						  <ul role="none">

						  </ul>
						</div>
					</li>`;

		const sanitizedContent = sanitizeHTML(html);

		const navLinks = document.querySelector('.primary-links');
		const firstChild = navLinks.firstElementChild;

		while (sanitizedContent.firstChild) {
			firstChild.insertAdjacentElement('afterend', sanitizedContent.firstChild);
		}

		// Add event listener for toggling the menu
		const devMenuWrapper = document.querySelector('#ext-dev-menu-wrapper');
		const devMenuLink = document.querySelector('#nav-primary-dev-branch');

		devMenuLink.addEventListener('click', function (e) {
			e.preventDefault();
			const isExpanded = devMenuLink.getAttribute('aria-expanded');

			if (isExpanded === 'true') {
				devMenuLink.setAttribute('aria-expanded', 'false');
			} else {
				devMenuLink.setAttribute('aria-expanded', 'true');
			}

			devMenuWrapper.classList.toggle('active');
		});

		// Generate and insert menu items
		const menuItems = await generateAllMenuItems(hubId);

		const devMenuUL = document.querySelector('#ext-dev-menu ul');

		// Create a temporary element to safely parse the HTML
		const tempContainer = document.createElement('div');
		tempContainer.innerHTML = menuItems;

		// Append each child element individually to the devMenuUL
		while (tempContainer.firstChild) {
			devMenuUL.appendChild(tempContainer.firstChild);
		}
	}

	// Wait for the navigation elements
	function waitForEl(selector, callback) {
		if (document.querySelector(selector)) {
			callback();
		} else {
			setTimeout(function () {
				waitForEl(selector, callback);
			}, 100);
		}
	}

	const api = typeof browser !== 'undefined' ? browser : chrome;
	api.storage.local.get(['devMenu'], function (result) {
		const devMenuValue = result.devMenu;
		console.log('devMenu:', devMenuValue);
		if (devMenuValue) {
			let hubId;
			waitForEl('[href*="app.hubspot.com/design-manager"]', function () {

				console.log('Generating the developer menu');
				hubId = document.querySelector('[href*="app.hubspot.com/design-manager"]').href.split('/');
				generateDevMenu(hubId.pop());
			});
		}
	});
}

// A fun April fools joke, shows 'Sprocky'
function sprocky() {
	const api = typeof browser !== 'undefined' ? browser : chrome;

	api.storage.local.get(['sprocky'], async function (result) {
		console.log('sprocky:', result.sprocky);

		// Check if sprocky is enabled
		if (result.sprocky) {
			let sprockyQuotes;

			try {
				const response = await fetch(api.runtime.getURL('src/content.json'));
				const data = await response.json();
				sprockyQuotes = data.sprocky;
			} catch (error) {
				console.log('Error fetching or parsing JSON:', error);
			}

			let randomQuote = "There was an error loading Sprocky's quotes.";
			if (sprockyQuotes) {
				randomQuote = sprockyQuotes[Math.floor(Math.random() * sprockyQuotes.length)];
			}


			const sprockyDiv = document.createElement('div');
			sprockyDiv.id = 'sprocky';
			sprockyDiv.className = 'slide';
			sprockyDiv.innerHTML = `
			<button class="hide" title="Dismiss Sprocky">
				<span>x</span>
			</button>
			<div class="speech-bubble-ds">
				<p>${randomQuote}</p>
				<div class="speech-bubble-ds-arrow"></div>
			</div>`;

			const sprockyImg = document.createElement('div');
			sprockyImg.className = 'sprockyimg';
			sprockyImg.title = 'Disable Sprocky permanently by clicking the HS dev Chrome Extension';
			sprockyDiv.appendChild(sprockyImg);

			const sprockySVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			sprockySVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			sprockySVG.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
			sprockySVG.setAttribute('id', 'sprocky-svg');
			sprockySVG.setAttribute('width', '200');
			sprockySVG.className = 'blink';
			sprockySVG.setAttribute('viewBox', '0 0 146.5 147');
			sprockySVG.innerHTML = `
			<defs>
				<radialGradient id="radial-gradient" cx="122.7" cy="74" r="18" gradientUnits="userSpaceOnUse">
				<stop offset=".5" stop-color="#fff" />
				<stop offset=".8" stop-color="#fdfdfd" />
				<stop offset=".8" stop-color="#f6f6f6" />
				<stop offset=".9" stop-color="#ebebeb" />
				<stop offset="1" stop-color="#dadada" />
				<stop offset="1" stop-color="#c4c4c4" />
				</radialGradient>
				<radialGradient id="radial-gradient-2" cx="69.8" cy="74" r="18" xlink:href="#radial-gradient" />
			</defs>
			<g id="sprocket_layer" data-name="sprocket layer">
				<path id="sprocket" fill="#f47622" d="M127.5 69.8a37.5 37.5 0 0 0-13.6-13.4 36.5 36.5 0 0 0-13.7-4.8V33.8a13.1 13.1 0 0 0 8.1-12.3 13.5 13.5 0 1 0-27 0 13 13 0 0 0 8 12.3v17.8a39.4 39.4 0 0 0-12 3.7L29.3 19A14.8 14.8 0 0 0 30 15a15.1 15.1 0 1 0-7.3 12.8l3.2 2.4 43 31a36.3 36.3 0 0 0-6.1 7.1 33.3 33.3 0 0 0-5.6 18v1.3a37.6 37.6 0 0 0 2.4 13 34.3 34.3 0 0 0 5.6 9.7l-14.3 14.3a11.3 11.3 0 0 0-4-.8 11.6 11.6 0 1 0 11 8.2l14.8-14.8a37.7 37.7 0 0 0 6.6 3.6 38.3 38.3 0 0 0 15.3 3.2h1a36.8 36.8 0 0 0 31.3-17.4 33.9 33.9 0 0 0 5.3-18.2V88a35.8 35.8 0 0 0-4.7-18.2zm-18 31c-4 4.5-8.6 7.2-13.8 7.2h-.9a18.6 18.6 0 0 1-8.7-2.3 20.1 20.1 0 0 1-7.7-7 16.2 16.2 0 0 1-3.1-9.5v-1a19.5 19.5 0 0 1 2.2-9.4 20.5 20.5 0 0 1 7-7.8 17.5 17.5 0 0 1 10-3h.3a20 20 0 0 1 9.3 2.1 19.6 19.6 0 0 1 7.2 6.7 21 21 0 0 1 3.3 9.3v2a18.4 18.4 0 0 1-5.1 12.7z" />
			</g>
			<g id="right_eye" data-name="right eye">
				<ellipse id="right_eye_white" cx="122.7" cy="74" fill="url(#radial-gradient)" data-name="right eye white" rx="21.3" ry="14" />
				<ellipse id="right_pupil" cx="122.8" cy="74.4" class="cls-3" data-name="right pupil" rx="13.5" ry="8.8" />
				<path id="right_eyebrow" d="M146.4 63c.7-.6-2.3-10-10.5-14.8a16.8 16.8 0 0 0-9.4-2.6c-2 0-4.9.2-6.2 2.3a5.4 5.4 0 0 0 1.1 6.5c1.7 1.4 3.4.2 8.3.4a25 25 0 0 1 8.6 1.7c5.6 2.3 7.6 6.8 8 6.4z" class="cls-3" data-name="right eyebrow" />
			</g>
			<g id="left_eye" data-name="left eye">
				<ellipse id="left_eye_white" cx="69.8" cy="74" fill="url(#radial-gradient-2)" data-name="left eye white" rx="21.3" ry="14" />
				<ellipse id="left_pupil" cx="69.7" cy="74.4" class="cls-3" data-name="left pupil" rx="13.5" ry="8.8" />
				<path id="left_eyebrow" d="M43 63c-.8-.6 2.2-10 10.4-14.8a16.8 16.8 0 0 1 9.4-2.6c2 0 4.9.2 6.2 2.3a5.4 5.4 0 0 1-1.1 6.5c-1.7 1.4-3.4.2-8.3.4a25 25 0 0 0-8.6 1.7c-5.6 2.3-7.6 6.8-8 6.4z" class="cls-3" data-name="left eyebrow" />
			</g>`;

			document.body.insertAdjacentElement('beforeend', sprockyDiv);
			sprockyDiv.querySelector('.sprockyimg').appendChild(sprockySVG);

			const hideButton = sprockyDiv.querySelector('.hide');
			hideButton.addEventListener('click', hideSprocky);
		}
	});
}

// Hides the sprocky div
function hideSprocky() {
	var sprockyDiv = document.getElementById('sprocky');
	if (sprockyDiv) {
		sprockyDiv.style.display = 'none';
	}
}
