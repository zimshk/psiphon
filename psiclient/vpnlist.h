/*
 * Copyright (c) 2011, Psiphon Inc.
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

#pragma once

#include <vector>

using namespace std;

struct ServerEntry
{
    string serverAddress;
    int webServerPort;
    string webServerSecret;
};

typedef vector<ServerEntry> ServerEntries;
typedef ServerEntries::const_iterator ServerEntryIterator;

class VPNList
{
public:
    VPNList(void);
    virtual ~VPNList(void);
    bool AddEntryToList(const tstring& hexEncodedEntry);
    void MarkCurrentServerFailed(void);
    ServerEntry GetNextServer(void);

private:
    ServerEntries GetList(void);
    ServerEntries GetListFromEmbeddedValues(void);
    ServerEntries GetListFromSystem(void);
    ServerEntries ParseServerEntries(const char* serverEntryListString);
    void WriteListToSystem(const ServerEntries& serverEntryList);
    string EncodeServerEntries(const ServerEntries& serverEntryList);
};
