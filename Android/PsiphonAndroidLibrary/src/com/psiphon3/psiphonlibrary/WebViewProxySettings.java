/*
 * Copyright (c) 2013, Psiphon Inc.
 * All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

package com.psiphon3.psiphonlibrary;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

import org.apache.http.HttpHost;

import com.psiphon3.psiphonlibrary.Utils.MyLog;

import android.content.Context;
import android.os.Build;

public class WebViewProxySettings 
{

    public static void setLocalProxy(Context ctx, int port)
    {
        setProxy(ctx, "localhost", port);
    }
    
    /* 
    Proxy setting code taken directly from Orweb, with some modifications.
    (...And some of the Orweb code was taken from an earlier version of our code.)
    See: https://github.com/guardianproject/Orweb/blob/master/src/org/torproject/android/OrbotHelper.java#L39
    Note that we tried and abandoned doing feature detection by trying the 
    newer (>= ICS) proxy setting, catching, and then failing over to the older
    approach. The problem was that on Android 3.0, an exception would be thrown
    *in another thread*, so we couldn't catch it and the whole app would force-close.
    Orweb has always been doing an explicit version check, and it seems to work,
    so we're so going to switch to that approach.
    */
    public static boolean setProxy (Context ctx, String host, int port)
    {
        boolean worked = false;

        if (Build.VERSION.SDK_INT < 14) 
        {
            worked = setWebkitProxyGingerbread(ctx, host, port);
        }
        else
        {
            worked = setWebkitProxyICS(ctx, host, port);
        }
        
        return worked;
    }

    private static boolean setWebkitProxyGingerbread(Context ctx, String host, int port)
    {
        try
        {
            Object requestQueueObject = getRequestQueue(ctx);
            if (requestQueueObject != null) {
                //Create Proxy config object and set it into request Q
                HttpHost httpHost = new HttpHost(host, port, "http");   
                setDeclaredField(requestQueueObject, "mProxyHost", httpHost);
                
                return true;
            }
        }
        catch (Throwable e)
        {
            // Failed. Fall through to false return.
        }
        
        return false;
    }
    
    @SuppressWarnings("rawtypes")
    private static boolean setWebkitProxyICS(Context ctx, String host, int port)
    {
        try 
        {
            Class webViewCoreClass = Class.forName("android.webkit.WebViewCore");
           
            Class proxyPropertiesClass = Class.forName("android.net.ProxyProperties");
            if (webViewCoreClass != null && proxyPropertiesClass != null) 
            {
                Method m = webViewCoreClass.getDeclaredMethod("sendStaticMessage", Integer.TYPE, Object.class);
                Constructor c = proxyPropertiesClass.getConstructor(String.class, Integer.TYPE, String.class);
                
                if (m != null && c != null)
                {
                    m.setAccessible(true);
                    c.setAccessible(true);
                    Object properties = c.newInstance(host, port, null);
                
                    // android.webkit.WebViewCore.EventHub.PROXY_CHANGED = 193;
                    m.invoke(null, 193, properties);
                    return true;
                }
            }
        }
        catch (Exception e) 
        {
            MyLog.d("Exception setting WebKit proxy through android.webkit.Network: " + e.toString());
        }
        catch (Error e) 
        {
            MyLog.d("Exception setting WebKit proxy through android.webkit.Network: " + e.toString());
        }
        
        return false;
    }

    @SuppressWarnings("rawtypes")
    private static Object GetNetworkInstance(Context ctx) throws ClassNotFoundException
    {
        Class networkClass = Class.forName("android.webkit.Network");
        return networkClass;
    }
    
    private static Object getRequestQueue(Context ctx) throws Exception 
    {
        Object ret = null;
        Object networkClass = GetNetworkInstance(ctx);
        if (networkClass != null) 
        {
            Object networkObj = invokeMethod(networkClass, "getInstance", new Object[]{ctx}, Context.class);
            if (networkObj != null) 
            {
                ret = getDeclaredField(networkObj, "mRequestQueue");
            }
        }
        return ret;
    }

    private static Object getDeclaredField(Object obj, String name)
            throws SecurityException, NoSuchFieldException,
            IllegalArgumentException, IllegalAccessException 
    {
        Field f = obj.getClass().getDeclaredField(name);
        f.setAccessible(true);
        Object out = f.get(obj);
        return out;
    }

    private static void setDeclaredField(Object obj, String name, Object value)
            throws SecurityException, NoSuchFieldException,
            IllegalArgumentException, IllegalAccessException 
    {
        Field f = obj.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(obj, value);
    }

    @SuppressWarnings("rawtypes")
    private static Object invokeMethod(Object object, String methodName, Object[] params, Class... types) throws Exception 
    {
        Object out = null;
        Class c = object instanceof Class ? (Class) object : object.getClass();
        
        if (types != null) 
        {
            Method method = c.getMethod(methodName, types);
            out = method.invoke(object, params);
        } 
        else 
        {
            Method method = c.getMethod(methodName);
            out = method.invoke(object);
        }
        return out;
    }
}
