# alp-sdk-java

Official Java SDK for the Autonomous Lifecycle Protocol (ALP).

## Requirements

- Java 17+
- Maven 3.8+

## Installation

```xml
<dependency>
  <groupId>com.alp</groupId>
  <artifactId>alp-sdk-java</artifactId>
  <version>45.0.0</version>
</dependency>
```

## Usage

```java
import com.alp.sdk.AlpObject;
import com.alp.sdk.AlpParser;
import com.alp.sdk.AlpWorkspace;
import com.alp.sdk.AlpGraph;

import java.nio.file.Path;

public class Example {
    public static void main(String[] args) throws Exception {
        AlpWorkspace workspace = new AlpWorkspace();
        workspace.load(Path.of("./my-project"));

        List<AlpObject> objects = workspace.getObjects();
        AlpGraph graph = workspace.getGraph();
        List<AlpObject> order = workspace.getExecutionOrder();

        AlpObject found = workspace.findById("my-object-id");
    }
}
```

## Status

Stable.
