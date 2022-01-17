using System;
using System.Data;
using System.Runtime.Serialization;
using System.Net.Mail;
using MySql.Data.MySqlClient;
using System.Collections.Generic;

namespace Routes
{

    [DataContract]
    public class Login
    {
        [DataMember(Name = "name")]
        public string Name { get; set; }
        [DataMember(Name = "pw")]
        public string PW { get; set; }
        [DataMember(Name = "email")]
        public string Email { get; set; }
        [DataMember(Name = "code")]
        public string EmailCode { get; set; }
        [DataMember(Name = "id")]
        public int ID { get; set; }
        [DataMember(Name = "role")]
        public int Role { get; set; }
        [DataMember(Name = "units")]
        public char Units { get; set; }
        [DataMember(Name = "climbs")]
        public int Climbs { get; set; }
        [DataMember(Name = "notifications")]
        public int Notify { get; set; }


        public Login(string name, string pw)
        {
            Name = name;
            PW = pw;
        }
        public Login(string name, string pw, string email)
        {
            Name = name;
            PW = pw;
            Email = email;
        }
        public Login(int id, string name, string email, int notify)
        {
            ID = id;
            Name = name;
            Notify = notify;
            Email = email;
        }

    }


    public partial class Routes : IRoutes, IDisposable
    {

        /// <summary>
        /// Log in to the system
        /// </summary>
        /// <param name="login">login object with just a username and password</param>
        /// <returns>login object with details of role and user id</returns>
        public Login Login(Login login)
        {

            string hash = Logdata.GetHash(login.PW);
            LogEntry log = new LogEntry("Login", login.Name);
            string result = "";

            // can now login with either username or email
            string query = string.Format("SELECT Id, name, pw, email, role, units, climbs, notifications FROM logins where name = '{0}'  or email = '{0}'", login.Name);
            if (gpxConnection.IsConnect())
            {
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);

                        int length = dataLogins.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            DataRow dr = dataLogins.Rows[row];
                            string dbname = (string)dr["name"];
                            dbname = dbname.Trim();
                            string dbpw = (string)dr["pw"];
                            dbpw = dbpw.Trim();
                            string dbemail = (string)dr["email"];
                            dbemail = dbemail.Trim();

                            // login with either username or email
                            if ((dbname == login.Name && dbpw == hash) || (dbemail == login.Name && dbpw == hash))
                            {
                                if (dbemail == login.Name)
                                {
                                    // change back to actual login name
                                    login.Name = dbname;
                                }
                                login.Role = (int)dr["role"];
                                login.ID = (int)dr["id"];
                                login.Email = (string)dr["email"];
                                login.Units = ((string)dr["units"])[0];
                                login.Climbs = (int)dr["climbs"];
                                login.Notify = (int)dr["notifications"];
                                // don't need to return the password
                                login.PW = String.Empty;
                                break;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    result = "There is a database error, please try again:" + ex.Message;
                    log.Error = ex.Message;
                }
                finally
                {
                    log.Result = login.Name;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
                return login;
            }
            return null;
        }

        public IEnumerable<Login> GetLogins()
        {
            LogEntry log = new LogEntry("GetDatesWithRides", "");

            List<Login> logins = new List<Login>();
            string result = "";

            // can now login with either username or email
            string query = string.Format("SELECT id, name, email, notifications FROM logins");
            if (gpxConnection.IsConnect())
            {
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);

                        int length = dataLogins.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            DataRow dr = dataLogins.Rows[row];
                            string dbname = (string)dr["name"];
                            dbname = dbname.Trim();
                            int dbnotify = (int)dr["notifications"];
                            int dbid = (int)dr["id"];
                            string dbemail = (string)dr["email"];
                            dbemail = dbemail.Trim();
                            logins.Add(new Login(dbid, dbname, dbemail, dbnotify));
                        }
                    }

                }
                catch (Exception ex2)
                {
                    log.Error = ex2.Message;
                }
                finally
                {
                    log.Result = logins.Count.ToString() + " logins found";
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return logins;
        }

        public string Register(Login login)
        {

            LogEntry log = new LogEntry("Register2", login.Name + " " + login.EmailCode);
            string result = "";
            if (login.EmailCode == Logdata.GetHash(login.Name + login.Name))
            {
                string query = string.Format("update logins set role = 1 where name = '{0}'",
                    login.Name);
                if (gpxConnection.IsConnect())
                {
                    try
                    {
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                        result = "Thank you, you have now registered";
                    }
                    catch (Exception ex)
                    {
                        result = "There is a database error, please try again:" + ex.Message;
                        log.Error = ex.Message;
                    }
                    finally
                    {
                        log.Result = login.Name;
                        log.Save(gpxConnection);
                        gpxConnection.Close();
                    }
                }
                else
                    return DBConnection.ErrStr;

                return result;
            }
            else
                return "Error with email or code, sorry";
        }


        public string Signup(Login login)
        {
            string hash = Logdata.GetHash(login.PW);
            LogEntry log = new LogEntry("Signup", login.Name);


            MailAddress emailAddr;
            string result = "OK, now please wait for an email and click the link to complete your registration. Please check that rides@truro.cc is in your contact list and not treated as junk mail";
            try
            {
                emailAddr = new MailAddress(login.Email);
                // Valid address
            }
            catch
            {
                return ("This email address appears to be invalid");
            }
            if (login.PW.Length < 4 || login.PW.Length > 10)
                return ("Password must be between 4 and 10 characters");



            if (gpxConnection.IsConnect())
            {
                // check username and email
                string query = "SELECT Id, name, pw, email FROM logins";
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);

                        int length = dataLogins.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            DataRow dr = dataLogins.Rows[row];
                            string dbname = (string)dr["name"];
                            dbname = dbname.Trim();
                            string dbpw = (string)dr["pw"];
                            dbpw = dbpw.Trim();
                            string dbemail = (string)dr["email"];
                            dbemail = dbemail.Trim();
                            if (dbname.ToLower() == login.Name.ToLower())
                            {
                                return ("Sorry, this username has already been taken");
                            }
                            if (dbemail == login.Email)
                            {
                                return ("Sorry, only one login allowed per email address");
                            }
                            if (EmailConnection.IsValidEmail(dbemail) == false)
                            {
                                return ("Sorry, this email doesn't appear to be valid");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    log.Error = ex.Message;
                    return "DB error: " + ex.Message;

                }

                // create and send an email
                try
                {
                    // create a code based on data
                    login.EmailCode = Logdata.GetHash(login.Name + login.Name);

                    string URLstr = string.Format(Connections.serviceURL + "?user={0}&regcode={1}", login.Name, login.EmailCode);
                    //string URLstr = string.Format("http://localhost/routes/www?user={0}&regcode={1}",login.Name, login.EmailCode);

                    EmailConnection ec = new EmailConnection();
                    MailAddress from = new MailAddress("rides@truro.cc");
                    MailMessage message = new MailMessage(from, emailAddr)
                    {
                        Subject = "TCC rides signup",
                        Body = string.Format("Please click {0}  to complete your registration\n\r\n\rFor security, this link will expire in 15 minutes!", URLstr)
                    };

                    try
                    {
                        SmtpClient client = new System.Net.Mail.SmtpClient(ec.Server)
                        {
                            Credentials = new System.Net.NetworkCredential(ec.User, ec.PW)
                        };
                        client.Send(message);

                        // save the login details but with role as zero so login won't yet work
                        log = new LogEntry("Register1", login.Name + " " + login.EmailCode);
                        query = string.Format("insert into logins (name, pw, email,role,messagetime,units,climbs,notifications) values ('{0}','{1}','{2}',{3},'{4}','{5}',{6},{7})",
                            login.Name, hash, login.Email, 0, Logdata.DBTimeString(DateTime.Now), login.Units, login.Climbs, login.Notify);

                        try
                        {
                            var cmd = new MySqlCommand(query, gpxConnection.Connection);
                            cmd.ExecuteNonQuery();
                            result = "Thank you, please wait for an email and click link to complete registration. Please check that rides@truro.cc is in your contact list and not treated as junk mail";
                        }
                        catch (Exception ex2)
                        {
                            result = "There is a database error, please try again:" + ex2.Message; ;
                        }
                    }
                    catch (Exception ex)
                    {
                        result = "Sorry, there is an error with the email service: " + ex.Message;
                    }



                }
                catch (Exception ex2)
                {
                    result = "Error: " + ex2.Message;
                    log.Error = ex2.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
                return result;
            }
            else
                return DBConnection.ErrStr;

        }

        public string ChangeAccount(Login login)
        {

            LogEntry log = new LogEntry("ChangeAccount", login.Name);
            string query;
            string result = "";

            if (gpxConnection.IsConnect())
            {
                try
                {
                    if (login.PW != string.Empty) // has actually been changed
                    {
                        string hash = Logdata.GetHash(login.PW);
                        query = string.Format("update logins set pw = '{0}' where id = {1}", hash, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();

                    }
                    if (login.Email != string.Empty) // has actually been changed
                    {
                        query = string.Format("update logins set email = '{0}' where id = {1}", login.Email, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();

                    }
                    if (login.Name != string.Empty) // has actually been changed
                    {
                        query = string.Format("update logins set name = '{0}' where id = {1}", login.Name, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                    }
                    if (true)
                    {
                        query = string.Format("update logins set units = '{0}', climbs={1}, notifications={2} where id = {3}", login.Units, login.Climbs, login.Notify,login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                    }
                    result = "OK";

                }
                catch (Exception ex2)
                {
                    result = "There is a database error, some details not changed, please try again: " + ex2.Message;
                    log.Error = ex2.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            else
                return DBConnection.ErrStr;

            return result;
        }


        public string ForgetPassword(string email)
        {
            LogEntry log = new LogEntry("ForgetPassword", email);

            string result = "OK, now please wait for an email and click the link to set a new password.  Please check that rides@truro.cc is in your contact list and not teated as junk mail";
            string username = "";
            MailAddress emailAddr;
            try
            {
                emailAddr = new MailAddress(email);
                // Valid address
            }
            catch
            {
                return ("This email address appears to be invalid");
            }

            if (gpxConnection.IsConnect())
            {
                string query = string.Format("SELECT Id, name, email FROM logins where email = '{0}'", email);
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);
                        int count = dataLogins.Rows.Count;
                        if (count == 1)
                        {
                            DataRow dr = dataLogins.Rows[0];
                            string dbname = (string)dr["name"];
                            username = dbname.Trim();

                        }
                        else if (count == 0)
                        {
                            return string.Format("Error: cannot find an account with that email");
                        }
                        else
                        {
                            return string.Format("Error: {0} users found with that email", dataLogins.Rows.Count);
                        }
                    }
                }
                catch (Exception ex)
                {
                    log.Error = ex.Message;
                    return "DB error: " + ex.Message;

                }

                // create and send an email
                try
                {
                    // create a code based on data
                    string emailCode = Logdata.GetHash(username + username);

                    // string URLstr = string.Format("https://quilkin.co.uk/tccrides?pwuser={0}&regcode={1}", username, emailCode);
                    string URLstr = string.Format(Connections.serviceURL + "?pwuser={0}&regcode={1}", username, emailCode);

                    EmailConnection ec = new EmailConnection();
                    MailAddress from = new MailAddress("rides@truro.cc");
                    MailMessage message = new MailMessage(from, emailAddr)
                    {
                        Subject = "TCC RideHub forgotten password",
                        Body = string.Format("Please click {0}  to reset your password or other details.\n\rFor security, this link will expire in 15 minutes!", URLstr)
                    };

                    try
                    {
                        SmtpClient client = new System.Net.Mail.SmtpClient(ec.Server)
                        {
                            Credentials = new System.Net.NetworkCredential(ec.User, ec.PW)
                        };
                        client.Send(message);

                        // save the time this message was delivered

                        query = string.Format("update logins set messagetime = '{0}' where email = '{1}'", Logdata.DBTimeString(DateTime.Now), email);

                        try
                        {
                            var cmd = new MySqlCommand(query, gpxConnection.Connection);
                            cmd.ExecuteNonQuery();

                        }
                        catch (Exception ex2)
                        {
                            result = "There is a database error, please try again:" + ex2.Message;
                            log.Error = ex2.Message;
                        }
                        //result = "OK, now please wait for an email and click the link to set a new password";

                    }
                    catch (Exception ex)
                    {
                        result = "Sorry, there is an error with the email service: " + ex.Message;
                        log.Error = ex.Message;
                    }

                }
                catch (Exception ex2)
                {
                    return "Error: " + ex2.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
                return result;
            }
            else
                return DBConnection.ErrStr;

        }
        public string CheckTimeout(string username)
        {
            LogEntry log = new LogEntry("CheckTimeout", username);
            string result = "";

            if (gpxConnection.IsConnect())
            {
                string query = string.Format("SELECT id, messagetime FROM logins where name = '{0}'", username);
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);
                        int count = dataLogins.Rows.Count;
                        if (count == 1)
                        {
                            DataRow dr = dataLogins.Rows[0];
                            DateTime msgTime = (DateTime)dr["messagetime"];
                            int id = (int)dr["id"];
                            TimeSpan since = DateTime.Now - msgTime;
                            if (since.TotalMinutes > 15)
                            {
                                return "Sorry, email code has timed out. Please request your details again.";
                            }
                            else
                            {
                                result = "OK" + id.ToString();
                            }


                        }
                        else
                        {
                            result = string.Format("DB Error: {0} users found ", dataLogins.Rows.Count);
                            log.Error = result;
                        }
                    }
                }
                catch (Exception ex)
                {
                    result = "DB error: " + ex.Message;
                    log.Error = ex.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }

            }
            else
                return DBConnection.ErrStr;
            return
                result;
        }

    }

}