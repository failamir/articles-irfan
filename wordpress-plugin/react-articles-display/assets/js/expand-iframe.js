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
                isExpanded = !isExpanded;
                var btn = evt.target || evt.srcElement;
                
                if (isExpanded) {
                    iframe.style.height = expandedHeight;
                    btn.textContent = 'Tutup';
                    btn.classList.add('expanded');
                    
                    // Scroll to the iframe
                    if (typeof iframe.scrollIntoView === 'function') {
                        var scrollOptions = { behavior: 'smooth', block: 'nearest' };
                        iframe.scrollIntoView(scrollOptions);
                    }
                    
                    // Send message to iframe to notify it's expanded
                    if (iframe.contentWindow) {
                        var message = JSON.stringify({ 
                            type: 'iframeExpanded', 
                            isExpanded: true 
                        });
                        iframe.contentWindow.postMessage(message, '*');
                    }
                } else {
                    iframe.style.height = collapsedHeight;
                    btn.textContent = 'Lihat Semua';
                    btn.classList.remove('expanded');
                    
                    // Send message to iframe to notify it's collapsed
                    if (iframe.contentWindow) {
                        var message = JSON.stringify({ 
                            type: 'iframeExpanded', 
                            isExpanded: false 
                        });
                        iframe.contentWindow.postMessage(message, '*');
                    }
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
        try {
            var data = JSON.parse(event.data);
            if (!data || typeof data !== 'object' || !data.type) return;
            
            if (data.type === 'requestHeight') {
                var iframe = document.getElementById(data.iframeId);
                if (!iframe || !iframe.contentWindow) return;
                
                var button = document.querySelector('[data-iframe-id="' + data.iframeId + '"]');
                if (!button) return;
                
                var isExpanded = button.classList.contains('expanded');
                var height = isExpanded ? 
                    button.getAttribute('data-expanded-height') : 
                    button.getAttribute('data-collapsed-height');
                
                var response = JSON.stringify({ 
                    type: 'setHeight',
                    isExpanded: isExpanded,
                    height: height
                });
                
                iframe.contentWindow.postMessage(response, '*');
            }
        } catch (e) {
            // Ignore invalid messages
            if (window.console && typeof window.console.error === 'function') {
                console.error('Error processing message:', e);
            }
        }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Clean up event listener when the page is unloaded
    window.addEventListener('beforeunload', function() {
        window.removeEventListener('message', handleMessage);
    });
});
