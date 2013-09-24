# The DocPad Configuration File
# It is simply a CoffeeScript Object which is parsed by CSON
docpadConfig = {

  # =================================
  # Template Data
  # These are variables that will be accessible via our templates
  # To access one of these within our templates, refer to the FAQ: https://github.com/bevry/docpad/wiki/FAQ

  templateData:
    # Specify some site properties
    site:
      # The production url of our website
      url: "http://play.psiphon3.com"

      # Here are some old site urls that you would like to redirect from
      oldUrls: []

      # The website description (for SEO)
      description: """
        When your website appears in search results in say Google, the text here will be shown underneath your website's title.
        """

      # The website keywords (for SEO) separated by commas
      keywords: """
        place, your, website, keywords, here, keep, them, related, to, the, content, of, your, website
        """

      companyName: "Psiphon Inc."

      # The website author's name
      author: "Psiphon Inc."

      # The website author's email
      email: "info@psiphon.ca"

      # Styles
      styles: [
        "/styles/twitter-bootstrap.css"
        "/vendor/highlightjs.css"
        "/styles/style.css"
      ]

      # Scripts
      scripts: [
        "/vendor/jquery-1.10.2.min.js"
        "/vendor/modernizr-2.6.2.min.js"
        "/vendor/twitter-bootstrap/dist/js/bootstrap.min.js"
        "/scripts/script.js"
      ]


    # Enabled languages
    languages: ['en', 'fa']

    # Info about all pages
    # This would be largely unnecessary if we could put metadata on layouts
    pageInfo:
      'download':
        filename: '/download.html'
        title_key: 'download-title'
        nav_title_key: 'download-nav-title'

      'user-guide':
        filename: '/user-guide.html'
        title_key: 'user-guide-title'
        nav_title_key: 'user-guide-nav-title'

      'faq':
        filename: '/faq.html'
        title_key: 'faq-title'
        nav_title_key: 'faq-nav-title'

      'sponsor':
        filename: '/sponsor.html'
        title_key: 'sponsor-title'
        nav_title_key: 'sponsor-nav-title'

      'about':
        filename: '/about.html'
        title_key: 'about-title'
        nav_title_key: 'about-nav-title'

      'license':
        filename: '/license.html'
        title_key: 'license-title'
        nav_title_key: 'license-nav-title'

    navLayout: [
      { name: 'download' }
      {
        name: 'resources',
        nav_title_key: 'resources-nav-title'
        subnav: [
          { name: 'user-guide' }
          { name: 'faq' }
          { name: 'about' }
          { name: 'license' }
        ]
      }
      { name: 'sponsor' }
    ]

    downloads:
      windows: '/psiphon3.exe'
      android: '/PsiphonAndroid.apk'
      email: 'get@psiphon3.com'
      playstore: 'https://play.google.com/store/apps/details?id=com.psiphon3'
      amazonappstore: 'http://www.amazon.com/gp/product/B00FAV9K4Q/ref=mas_pm_Psiphon'

    # -----------------------------
    # Helper Functions

    # Throws exception if `name` not found.
    getPageInfo: (name) ->
      if name not of @pageInfo
        throw "bad page name: #{name}"
      return @pageInfo[name]

    # The title might need to be translated from a string key.
    # `document` arugment is optional -- if not supplied, @document will be used
    getTitle: (document) ->
      if not document
        document = @document

      if document.title?
        return document.title

      title_key = document.title_key
      if not title_key?
        title_key = @getPageInfo(document.basename).title_key

      if title_key?
        return @tt title_key

      throw "#{document.name} has no title"
      return ''

    # Get the prepared site/document title
    # Often we would like to specify particular formatting to our page's title
    # we can apply that formatting here
    getPreparedTitle: ->
      # if we have a document title, then we should use that and suffix the site's title onto it
      title = @getTitle()
      if title
        "#{title} | #{@tt 'site-title'}"
      # if our document does not have it's own title, then we should just use the site's title
      else
        @tt 'site-title'

    # Get the prepared site/document description
    getPreparedDescription: ->
      # if we have a document description, then we should use that, otherwise use the site's description
      @document.description or @site.description

    # Get the prepared site/document keywords
    getPreparedKeywords: ->
      # Merge the document keywords with the site keywords
      @site.keywords.concat(@document.keywords or []).join(', ')

    # Translate the given key into the language of the current document.
    # Fails back to English if the key is not found.
    tt: (key) ->
      fallback_language = 'en'
      if @feedr.feeds[@document.language][key]?
        return @feedr.feeds[@document.language][key].message
      else if @feedr.feeds[fallback_language][key]?
        return @feedr.feeds[fallback_language][key].message
      console.log "bad translation key: #{key}"
      throw "bad translation key: #{key}"

    # Translate the desired URL into a language-specific URL
    ttURL: (key) ->
      fallback_language = 'en'

      key_decomposition = key.match /^(.+)\.([^\.]+)/
      key_url_stem = key_decomposition[1]
      key_url_ext = key_decomposition[2]

      target_url = "#{key_url_stem}.#{@document.language}.#{key_url_ext}"
      fallback_url = "#{key_url_stem}.#{fallback_language}.#{key_url_ext}"
      fallback_url_found = no

      # Look for a translated file
      for file in @getCollection('files').toJSON()
        if file.url == target_url
          # Translated file exists
          return file.url

        if file.url == fallback_url
          # Found the fallback -- remember for later
          fallback_url_found = yes

      if not fallback_url_found
        throw "bad translation for URL: #{key}"

      return fallback_url

      # We didn't find a translated file, so look for a fallback file

    rtl_languages: ['ar', 'fa', 'he']


    # `document` arugment is optional -- if not supplied, @document will be used
    isRTL: (document=null) ->
      if not document
        document = @document
      document.language in @rtl_languages


    # `document` arugment is optional -- if not supplied, @document will be used
    ifRTL: (rtlValue, ltrValue='', document=null) ->
      if @isRTL(document) then rtlValue else ltrValue


    languageLabel: (languageCode) ->
      map =
        "ar": "العربية"
        "cs": "Čeština"
        "de": "Deutsch"
        "el": "Ελληνικά"
        "en": "English"
        "es": "Español"
        "et": "Eesti"
        "fa": "فارسی"
        "fi": "Suomi"
        "fr": "Français"
        "hu": "Magyar"
        "it": "Italiano"
        "nl": "Nederlands"
        "pl": "Polski"
        "pt_BR": "Português(Br)"
        "ru": "Русский"
        "sv": "Svenska"
      if map[languageCode]
        map[languageCode]
      else
        languageCode


    # Returns the translated document object if `document` is available as a
    # translation in `lang`, otherwise returns falsy.
    documentTranslated: (document, targetLang) ->
      # document url has a leading '/'
      LANG_SPLIT_INDEX = 1
      currLang = document.url.split('/')[LANG_SPLIT_INDEX]
      return no if currLang not in @languages

      translatedURL = ['/'+targetLang].concat(document.url.split('/')[LANG_SPLIT_INDEX+1...]).join('/')
      translatedDoc = @getCollection('documents').findAllLive({url: translatedURL}).toJSON()
      return translatedDoc[0] if translatedDoc.length > 0

      return no


    # Returns the date formatted for the locale
    formatDate: (date) ->
      # Maybe we should use the JavaScript Date toLocaleDateString()?
      # Returning ISO8601 date for now
      month = date.getUTCMonth()
      if month < 10 then month = '0' + month
      return "#{date.getUTCFullYear()}-#{month}-#{date.getUTCDate()}"


    # Get the language appropriate absolute URL for a language-relative URL.
    # For example `getPathURL('/download.html')` might return `/en/download.html`.
    getPageURL: (partialURL) ->
      if partialURL[0] != '/'
        throw 'partialURL must be language-absolute: ' + partialURL

      # document url has a leading '/'
      LANG_SPLIT_INDEX = 1
      targetLang = @document.url.split('/')[LANG_SPLIT_INDEX]
      if targetLang not in @languages
        # Current document isn't language-specific. Default English.
        targetLang = 'en'

      translatedURL = '/' + targetLang + partialURL
      translatedDoc = @getCollection('documents').findAllLive({url: translatedURL}).toJSON()
      return @document.pathToRoot + translatedDoc[0].url if translatedDoc.length > 0

      # There's no language-specific version of this file. Just return the argument.
      return @document.pathToRoot + partialURL


  # =================================
  # Collections
  # These are special collections that our website makes available to us

  collections:
    # NOTE: This isn't just provide a collection of pages -- it's also (primarily)
    # used to derive the language from the page path and set it as the default
    # metadata.
    # Derived from: https://gist.github.com/balupton/4166806
    pages: (database) ->
      lang_dirs = ('/'+lang+'/' for lang in @config.templateData.languages)
      lang_regex = ('^'+lang_dir for lang_dir in lang_dirs).join('|')

      @getCollection('documents').createChildCollection()
        .setFilter 'search', (model) ->
          return false if not model.get('url')

          lang_match = model.get('url').match(lang_regex)
          return false if not lang_match

          lang = lang_match[0].replace(/^\/|\/$/g, '')
          model.setMetaDefaults { language: lang }
          true

    posts: (database) ->
      database.findAllLive({layout: 'blog/post'}, [date:-1])


  # =================================
  # Plugins

  plugins:
    downloader:
      downloads: [
        {
          name: 'Twitter Bootstrap'
          path: 'src/files/vendor/twitter-bootstrap'
          url: 'https://codeload.github.com/twbs/bootstrap/tar.gz/master'
          tarExtractClean: true
        }
      ]

    fattrimmer:
      fat: [
        /\/_/  # files and directories with leading underscore
        /^\/vendor\/twitter-bootstrap\/(?!dist\/)/  # Twitter Bootstrap files that aren't in the "dist" folder
      ]

    feedr:
      cache: false
      log: console.log
      logError: console.error
      feeds:
        en:
          url: './_locales/en/messages.json'
        fa:
          url: './_locales/fa/messages.json'

  # =================================
  # DocPad Events

  # Here we can define handlers for events that DocPad fires
  # You can find a full listing of events on the DocPad Wiki
  events:

    # Server Extend
    # Used to add our own custom routes to the server before the docpad routes are added
    serverExtend: (opts) ->
      # Extract the server from the options
      {server} = opts
      docpad = @docpad

      # As we are now running in an event,
      # ensure we are using the latest copy of the docpad configuraiton
      # and fetch our urls from it
      latestConfig = docpad.getConfig()
      oldUrls = latestConfig.templateData.site.oldUrls or []
      newUrl = latestConfig.templateData.site.url

      # Redirect any requests accessing one of our sites oldUrls to the new site url
      server.use (req,res,next) ->
        if req.headers.host in oldUrls
          res.redirect(newUrl+req.url, 301)
        else
          next()


  # =================================
  # DocPad Environments

  environments:
    production:
      templateData:
        languages: ['en']

  # =================================
  # Other DocPad config

  ignoreCustomPatterns: /\.orig$/
}


# Export our DocPad Configuration
module.exports = docpadConfig