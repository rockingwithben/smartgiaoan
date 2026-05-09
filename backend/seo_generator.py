from bs4 import BeautifulSoup

def generate_seo_metadata(html_content, worksheet_data=None):
    soup = BeautifulSoup(html_content, 'html.parser')

    # Default meta data
    title = "SmartGiaoAn | ESL Worksheets Vietnam · Cambridge & CEFR Worksheets"
    description = "Generate 3-page Cambridge & CEFR-aligned ESL worksheets in seconds. Built for English teachers, centers, and IELTS classes in Vietnam."
    keywords = "ESL worksheets Vietnam, Cambridge CEFR worksheets, Cambridge English worksheets, IELTS worksheets Vietnam, printable ESL worksheets, giáo án tiếng Anh, AI lesson planner"
    og_url = "https://www.smartgiaoan.site/"
    og_image = "https://www.smartgiaoan.site/og-image.svg"

    if worksheet_data:
        # Dynamic meta for worksheet pages
        ws_title = worksheet_data.get("title", "Untitled Worksheet")
        ws_level = worksheet_data.get("level", "")
        ws_cefr = worksheet_data.get("cefr", "")
        ws_skill = worksheet_data.get("skill", "")
        ws_topic = worksheet_data.get("topic", "")
        ws_id = worksheet_data.get("worksheet_id", "")

        title = f"{ws_title} | ESL Worksheet {ws_level} ({ws_cefr}) - SmartGiaoAn"
        description = f"ESL worksheet for {ws_level} ({ws_cefr}) students focusing on {ws_skill}{f' and {ws_topic}' if ws_topic else ''}. Generate and print your own custom worksheets."
        keywords = f"{ws_skill} worksheet, {ws_level} ESL, {ws_cefr} English, {ws_topic} lessons, SmartGiaoAn"
        og_url = f"https://www.smartgiaoan.site/worksheet/{ws_id}"
        # og_image could be dynamic based on worksheet content, but for now, use default

    # Update existing or add new meta tags
    def update_or_create_meta(name_or_property, content, is_property=False):
        attr = 'property' if is_property else 'name'
        tag = soup.find('meta', {attr: name_or_property})
        if tag:
            tag['content'] = content
        else:
            new_tag = soup.new_tag('meta')
            new_tag[attr] = name_or_property
            new_tag['content'] = content
            soup.head.append(new_tag)
            
    # Title Tag
    title_tag = soup.find('title')
    if title_tag:
        title_tag.string = title
    else:
        new_title_tag = soup.new_tag('title')
        new_title_tag.string = title
        soup.head.append(new_title_tag)

    update_or_create_meta('description', description)
    update_or_create_meta('keywords', keywords)
    update_or_create_meta('og:title', ogTitle or title, is_property=True)
    update_or_create_meta('og:description', ogDescription or description, is_property=True)
    update_or_create_meta('og:url', ogUrl, is_property=True)
    update_or_create_meta('og:image', ogImage, is_property=True)
    update_or_create_meta('twitter:title', ogTitle or title)
    update_or_create_meta('twitter:description', ogDescription or description)
    update_or_create_meta('twitter:image', ogImage)
    
    # Add canonical link if not present or update it
    canonical_link = soup.find('link', {'rel': 'canonical'})
    if canonical_link:
        canonical_link['href'] = og_url
    else:
        new_canonical = soup.new_tag('link')
        new_canonical['rel'] = 'canonical'
        new_canonical['href'] = og_url
        soup.head.append(new_canonical)

    return str(soup)