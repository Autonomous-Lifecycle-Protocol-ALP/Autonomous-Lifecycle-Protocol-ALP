use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("protobuf/hydra.proto");
    let proto_path = proto.parent().unwrap();

    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .out_dir(std::env::var("OUT_DIR").unwrap())
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile_protos(&[&proto], &[proto_path])?;

    Ok(())
}
