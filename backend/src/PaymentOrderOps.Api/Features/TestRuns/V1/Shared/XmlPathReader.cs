using System.Xml;
using System.Xml.XPath;

namespace PaymentOrderOps.Api.Features.TestRuns.V1.Shared;

/// <summary>Box-standard <see cref="System.Xml.XPath"/> evaluation over a SOAP response string.</summary>
public static class XmlPathReader
{
    public static string? SelectValue(string xml, string xpath)
    {
        if (string.IsNullOrWhiteSpace(xml) || string.IsNullOrWhiteSpace(xpath))
        {
            return null;
        }

        try
        {
            var document = new XPathDocument(new XmlTextReader(new StringReader(xml)) { Namespaces = false });
            var navigator = document.CreateNavigator();
            var result = navigator.Evaluate(xpath);

            return result switch
            {
                XPathNodeIterator iterator => iterator.MoveNext() ? iterator.Current?.Value : null,
                null => null,
                _ => Convert.ToString(result, System.Globalization.CultureInfo.InvariantCulture),
            };
        }
        catch (XPathException)
        {
            return null;
        }
        catch (XmlException)
        {
            return null;
        }
    }
}
