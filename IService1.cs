using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;
using System.Data;

namespace Routes
{

     [ServiceContract]
    public interface IRoutes
    {

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRouteSummaries", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Route>))]
        IEnumerable<Route> GetRouteSummaries();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRidesForDate", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Ride>))]
        IEnumerable<Ride> GetRidesForDate(int date);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetGPXforRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Route>))]
        string GetGPXforRoute(int routeID);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Login", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Login Login(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Signup", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string Signup(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/SaveRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string SaveRoute(Route route);


    }

}
