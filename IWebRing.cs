using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;
using System.Data;

namespace WebRing
{

    [ServiceContract]
    public interface IWebRing
    {
        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/TestService", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(string))]
        string TestService();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRouteSummaries", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<MeccanoSite>))]
        IEnumerable<MeccanoSite> GetRouteSummaries();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRoutesAll", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<MeccanoSite>))]
        IEnumerable<MeccanoSite> GetSitesAll();


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Login", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Login Login(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Signup", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string Signup(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/ChangeAccount", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string ChangeAccount(Login login);


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/SaveRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string SaveSite(MeccanoSite route);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/EditRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string EditSite(MeccanoSite route);


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Register", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string Register(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/DeleteRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string DeleteRoute(int routeID);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/UpdateRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string UpdateSite(MeccanoSite route);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/ForgetPassword", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string ForgetPassword(string email);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/CheckTimeout", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string CheckTimeout(string username);


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetLogins", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Login>))]
        IEnumerable<Login> GetLogins();

    }
}
