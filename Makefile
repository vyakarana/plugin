#

JS = $(wildcard client/*/*.js)
CSS = $(wildcard client/*/*.css)
JSON = $(wildcard client/*/*.json)
HTML = $(wildcard client/*/*.html)

#build: build/index.js #build/index.css
build: build.js back.js #build/index.css

# build/index.js: $(JS) $(HTML) $(JSON)
# build: $(JS) $(HTML) $(JSON)
build.js:
#	@duo --stdout client/index.js > public/javascripts/index.js
	@duo popup/content.js -o plugin

back.js:
#	@duo --stdout client/index.js > public/javascripts/index.js
	@duo background.js -o plugin

# Build the CSS source with Duo and Myth.
build/index.css:
#	@duo --type css client/index.css -o public/stylesheets
	@duo popup/popup.css # client/img/*.png

min:  components client views public routes client/boot client/example
	@component build --dev
	@minify build/build.js
	gzip -c build/build.min.js > build/build.min.js.gz

# anchor.js: anchor.html
# 	@component convert $<

components: component.json
	@component install --dev

clean:
	rm -fr build # components # anchor.js

test:
	@component build --dev
	node test/server

.PHONY: clean test example