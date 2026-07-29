# alp-go

Official Go SDK for the Autonomous Lifecycle Protocol (ALP).

## Requirements

- Go 1.22+

## Installation

```bash
go get github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go@v0.45.0
```

## Usage

```go
package main

import (
    "fmt"
    "github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go"
)

func main() {
    workspace := alpgo.NewAlpWorkspace()
    if err := workspace.Load("./my-project"); err != nil {
        panic(err)
    }

    objects := workspace.Objects()
    graph := workspace.Graph()
    order := workspace.ExecutionOrder()

    if found := workspace.FindByID("my-object-id"); found != nil {
        fmt.Printf("Found: %s\n", found.ID)
    }
}
```

## Status

Stable.
