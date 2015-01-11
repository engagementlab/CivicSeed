# Writing game resource content in Markdown

Uses Remarkable to parse CommonMark-style Markdown
https://github.com/jonschlinkert/remarkable

For text that needs some HTML formatting, light HTML markup (divs with
classes for styling) is used. Markdown syntax *is* parsed within the HTML
_provided_ that the text to parse follow a blank line. For instance, this
link will not appear:

```
<div class='example'>
To view something, [click here](http://link.com)
</div>
```

Instead, do this:

```
<div class='example'>

To view something, [click here](http://link.com)

</div>
```

This is preferable to writing the links as HTML because it keeps the
syntax for links standard across all articles.

