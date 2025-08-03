<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes"/>
  
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="rss/channel/title"/></title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
          }
          .header p {
            margin: 0;
            color: #7f8c8d;
          }
          .feed-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2196f3;
          }
          .item {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .item h3 {
            margin: 0 0 10px 0;
          }
          .item h3 a {
            color: #2c3e50;
            text-decoration: none;
          }
          .item h3 a:hover {
            color: #3498db;
          }
          .item-meta {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-bottom: 15px;
          }
          .item-description {
            color: #555;
          }
          .category {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 8px;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .header, .item {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1><xsl:value-of select="rss/channel/title"/></h1>
          <p><xsl:value-of select="rss/channel/description"/></p>
        </div>
        
        <div class="feed-info">
          <strong>📡 这是一个 RSS 订阅源</strong><br/>
          你可以将此链接添加到你的 RSS 阅读器中，以获取最新内容更新。
          推荐使用 Feedly、Inoreader 或其他 RSS 阅读器。
        </div>
        
        <xsl:for-each select="rss/channel/item">
          <div class="item">
            <h3>
              <a href="{link}"><xsl:value-of select="title"/></a>
            </h3>
            <div class="item-meta">
              📅 <xsl:value-of select="pubDate"/>
              <xsl:if test="category">
                ·
                <xsl:for-each select="category">
                  <span class="category"><xsl:value-of select="."/></span>
                </xsl:for-each>
              </xsl:if>
            </div>
            <div class="item-description">
              <xsl:value-of select="description"/>
            </div>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet> 