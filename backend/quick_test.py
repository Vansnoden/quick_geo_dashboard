



from database.utils import yaml_to_dashboard_js

yaml_text = """
geo-dashboard:
  name: "My Sales Dashboard"
  template: side_content
  stats:
    - type: bar
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
    - type: line
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
    - type: pie
      title: "Sales by Region"
      x: region
      y:
        column: sales
        aggregation: sum
  map:
    lat: latitude
    lon: longitude
  menus:
    about: "## About"
    stats: "Summary"
    map: "Map"
"""


def test_yaml_conversion():
    js = yaml_to_dashboard_js(yaml_text)
    print(js)


if __name__ == "__main__":
    test_yaml_conversion()