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
        [WebInvoke(Method = "POST", UriTemplate = "/TestService", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(string))]
        string TestService();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRouteSummaries", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Route>))]
        IEnumerable<Route> GetRouteSummaries();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetRidesForDate", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Ride>))]
        IEnumerable<Ride> GetRidesForDate(int date);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetDatesWithRides", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(List<Ride>))]
        IEnumerable<Ride> GetRecentRides();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetGPXforRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(string))]
        string GetGPXforRoute(int routeID);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetParticipants", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(string[]))]
        string[] GetParticipants(int[] rideIDs);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/GetCafes", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        [ServiceKnownType(typeof(string[]))]
        IEnumerable<Cafe> GetCafes();

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
        string SaveRoute(Route route);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/EditRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string EditRoute(Route route);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/SaveRide", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string SaveRide(Ride ride);


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/SaveParticipant", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string SaveParticipant(Participant pp);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/LeaveParticipant", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string LeaveParticipant(Participant pp);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/Register", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string Register(Login login);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/DeleteRide", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string DeleteRide(int rideID);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/DeleteRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string DeleteRoute(int routeID);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/UpdateRoute", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string UpdateRoute(Route route);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/ForgetPassword", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string ForgetPassword(string email);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/CheckTimeout", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string CheckTimeout(string username);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/SaveCafe", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string SaveCafe(Cafe cafe);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/DeleteCafe", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string DeleteCafe(int cafeID);


        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/EditRide", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        string EditRide(Ride ride);
    }
}
