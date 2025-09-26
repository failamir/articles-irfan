document.addEventListener("DOMContentLoaded", function() {
    // Add loading state
    var containers = document.getElementsByClassName("react-articles-container");
    for (var i = 0; i < containers.length; i++) {
        (function() {
            var container = containers[i];
            var iframes = container.getElementsByTagName("iframe");
            if (iframes.length > 0) {
                var iframe = iframes[0];
                container.classList.add("loading");
                iframe.style.opacity = "0";
                iframe.style.transition = "opacity 0.3s ease, height 0.3s ease";
                iframe.onload = function() {
                    container.classList.remove("loading");
                    this.style.opacity = "1";

                    // Store initial height if not set
                    var initialHeight = this.style.height || '600px';
                    this.setAttribute('data-collapsed-height', initialHeight);

                    // Notify the iframe content that parent is ready
                    if (this.contentWindow) {
                        this.contentWindow.postMessage({ type: 'IFRAME_READY' }, '*');
                    }
                };
            }
        })();
    }

    // Handle expand/collapse button
    var buttons = document.getElementsByClassName('expand-iframe-btn');
    for (var j = 0; j < buttons.length; j++) {
        (function() {
            var button = buttons[j];
            var isExpanded = false;
            var iframeId = button.getAttribute('data-iframe-id');
            var iframe = document.getElementById(iframeId);
            var collapsedHeight = button.getAttribute('data-collapsed-height');
            var expandedHeight = button.getAttribute('data-expanded-height');
            
            if (!iframe) return;
            
            // Set initial height
            if (iframe.style.height === '') {
                iframe.style.height = collapsedHeight;
            }
            
            button.addEventListener('click', function(evt) {
                evt.preventDefault();
                // Ask iframe (React app) to toggle; it will reply with height via REACT_APP_HEIGHT
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'TOGGLE_EXPAND' }, '*');
                }

                // Optional scroll into view to keep context
                if (typeof iframe.scrollIntoView === 'function') {
                    var scrollOptions = { behavior: 'smooth', block: 'nearest' };
                    iframe.scrollIntoView(scrollOptions);
                }
            });
            
            // Handle window resize to maintain proper height
            var handleResize = function() {
                if (isExpanded) {
                    iframe.style.height = expandedHeight;
                } else {
                    iframe.style.height = collapsedHeight;
                }
            };
            
            window.addEventListener('resize', handleResize);
            
            // Clean up event listener when the button is removed from DOM
            var observer = new MutationObserver(function() {
                if (!document.body.contains(button)) {
                    window.removeEventListener('resize', handleResize);
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        })();
    }
    
    // Listen for messages from iframe
    var handleMessage = function(event) {
        var payload = null;
        // Support both object and JSON string payloads
        if (typeof event.data === 'string') {
            try { payload = JSON.parse(event.data); } catch (e) { payload = null; }
        } else if (typeof event.data === 'object' && event.data !== null) {
            payload = event.data;
        }

        if (!payload || !payload.type) return;

        // React app sends its computed height
        if (payload.type === 'REACT_APP_HEIGHT') {
            // Find the corresponding iframe if possible
            var targetIframe = null;
            // Use event.source to locate the iframe window
            var allIframes = document.getElementsByTagName('iframe');
            for (var ii = 0; ii < allIframes.length; ii++) {
                if (allIframes[ii].contentWindow === event.source) {
                    targetIframe = allIframes[ii];
                    break;
                }
            }
            if (!targetIframe) return;

            // Adjust height
            if (typeof payload.height === 'number') {
                targetIframe.style.height = payload.height + 'px';
            }

            // Update any button linked to this iframe
            var btn = document.querySelector('[data-iframe-id="' + targetIframe.id + '"]');
            if (btn) {
                if (payload.isExpanded) {
                    btn.textContent = 'Tutup';
                    btn.classList.add('expanded');
                } else {
                    var collapsed = btn.getAttribute('data-collapsed-height') || targetIframe.getAttribute('data-collapsed-height') || '600px';
                    targetIframe.style.height = collapsed;
                    btn.textContent = 'Lihat Semua';
                    btn.classList.remove('expanded');
                }
            }
            return;
        }

        // Legacy message: iframe requests current target heights
        if (payload.type === 'requestHeight') {
            var ifm = document.getElementById(payload.iframeId);
            if (!ifm || !ifm.contentWindow) return;
            var button = document.querySelector('[data-iframe-id="' + payload.iframeId + '"]');
            if (!button) return;
            var expanded = button.classList.contains('expanded');
            var height = expanded ? button.getAttribute('data-expanded-height') : button.getAttribute('data-collapsed-height');
            var response = JSON.stringify({ type: 'setHeight', isExpanded: expanded, height: height });
            ifm.contentWindow.postMessage(response, '*');
            return;
        }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Clean up event listener when the page is unloaded
    window.addEventListener('beforeunload', function() {
        window.removeEventListener('message', handleMessage);
    });
});
